import sys
import json
import warnings
import pandas as pd
import numpy as np
import traceback
import os
import requests

warnings.filterwarnings("ignore")

def load_env():
    """Manually parse .env.local to get the TOGETHER_API_KEY"""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(root_dir, '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    k, v = line.strip().split('=', 1)
                    os.environ[k.strip()] = v.strip().strip("'").strip('"')

def get_together_embeddings(texts):
    api_key = os.environ.get("TOGETHER_API_KEY")
    if not api_key:
        raise ValueError("TOGETHER_API_KEY not found in .env.local! Please add it to use the Cloud Vector Engine.")
        
    url = "https://api.together.xyz/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    embeddings = []
    chunk_size = 50
    for i in range(0, len(texts), chunk_size):
        chunk = texts[i:i+chunk_size]
        payload = {
            "model": "intfloat/multilingual-e5-large-instruct", # The Top-Tier Multilingual Model you found!
            "input": chunk
        }
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code != 200:
            raise Exception(f"Together Embedding API Error: {res.text}")
        data = res.json()
        
        # Sort embeddings by index to maintain order just in case
        sorted_data = sorted(data['data'], key=lambda x: x['index'])
        for item in sorted_data:
            embeddings.append(item['embedding'])
            
    return np.array(embeddings)

def get_together_intent(representative_texts, candidate_labels):
    api_key = os.environ.get("TOGETHER_API_KEY")
    url = "https://api.together.xyz/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""You are a world-class linguistic AI that deeply understands regional languages, slang, and code-mixing (e.g., Tanglish, Hinglish, Bengali, Tamil, etc.).

Analyze the following cluster of user reviews (which all share the same mathematical intent based on their vector embeddings):
{json.dumps(representative_texts, indent=2)}

You MUST classify the underlying intent of these reviews into EXACTLY ONE of the following categories:
{json.dumps(candidate_labels, indent=2)}

Respond with ONLY the exact category name from the list. Do not explain. Do not add punctuation.
"""
    model_str = os.environ.get("LOCAL_LLM_MODEL", "meta-llama/Llama-3.3-70B-Instruct-Turbo")
    payload = {
        "model": model_str,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.0,
        "max_tokens": 20
    }
    
    res = requests.post(url, json=payload, headers=headers)
    if res.status_code != 200:
        raise Exception(f"Together LLM API Error: {res.text}")
        
    data = res.json()
    reply = data['choices'][0]['message']['content'].strip()
    
    # Fuzzy match to ensure it returns one of the exact labels
    best_match = candidate_labels[0]
    for label in candidate_labels:
        if label.lower() in reply.lower():
            best_match = label
            break
            
    return best_match

def detect_text_column(df):
    cat_cols = df.select_dtypes(include=['object', 'string']).columns.tolist()
    if not cat_cols:
        return None
        
    best_col = None
    max_avg_len = 0
    
    for col in cat_cols:
        try:
            texts = df[col].dropna().astype(str)
            if len(texts) == 0:
                continue
            avg_len = texts.str.len().mean()
            if avg_len > max_avg_len:
                max_avg_len = avg_len
                best_col = col
        except:
            pass
            
    return best_col

def run_multilingual_clustering(texts, num_clusters=8):
    try:
        from sklearn.cluster import KMeans
        
        load_env()
        
        # 1. Cloud Multilingual Embeddings (intfloat/multilingual-e5-large-instruct)
        embeddings = get_together_embeddings(texts)
        
        # 2. Local K-Means Clustering on the vectors
        n_clusters = min(num_clusters, max(2, len(texts) // 10))
        clustering_model = KMeans(n_clusters=n_clusters, random_state=42)
        clustering_model.fit(embeddings)
        cluster_assignment = clustering_model.labels_
        
        candidate_labels = [
            "refund or money issue", 
            "late delivery or delay", 
            "customer support complaint", 
            "app crash or bug", 
            "pricing or hidden charges", 
            "positive praise or love",
            "fraud or scam",
            "feature request"
        ]
        
        cluster_intents = []
        
        for i in range(n_clusters):
            cluster_texts = [texts[j] for j in range(len(texts)) if cluster_assignment[j] == i]
            pct = (len(cluster_texts) / len(texts)) * 100
            
            if len(cluster_texts) == 0:
                continue
                
            centroid = clustering_model.cluster_centers_[i]
            
            cluster_embeddings = [embeddings[j] for j in range(len(texts)) if cluster_assignment[j] == i]
            distances = np.linalg.norm(cluster_embeddings - centroid, axis=1)
            closest_indices = np.argsort(distances)[:3]
            
            representative_texts = [cluster_texts[idx] for idx in closest_indices]
            
            # 3. Cloud Llama-3 Intent Tagging
            predicted_intent = get_together_intent(representative_texts, candidate_labels)
            
            cluster_intents.append({
                "intent": predicted_intent,
                "prevalence_percentage": round(pct, 1),
                "representative_regional_quotes": representative_texts
            })
            
        aggregated_intents = {}
        for c in cluster_intents:
            intent = c["intent"]
            if intent not in aggregated_intents:
                aggregated_intents[intent] = {
                    "intent": intent,
                    "prevalence_percentage": 0,
                    "representative_regional_quotes": []
                }
            aggregated_intents[intent]["prevalence_percentage"] += c["prevalence_percentage"]
            aggregated_intents[intent]["representative_regional_quotes"].extend(c["representative_regional_quotes"])
            
        final_list = list(aggregated_intents.values())
        final_list.sort(key=lambda x: x["prevalence_percentage"], reverse=True)
        
        return final_list
        
    except ImportError as e:
        return {"error": f"Missing dependency: {str(e)}"}
    except Exception as e:
        return {"error": f"Clustering failed: {str(e)}\n{traceback.format_exc()}"}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No CSV file provided"}))
        sys.exit(1)
        
    csv_path = sys.argv[1]
    
    try:
        with open(csv_path, 'r') as f:
            chunk = f.read(100).strip()
        
        if chunk.startswith('['):
            df = pd.read_json(csv_path)
        else:
            df = pd.read_csv(csv_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to read dataset: {str(e)}"}))
        sys.exit(1)
        
    text_col = detect_text_column(df)
    
    if not text_col:
        print(json.dumps({"error": "Could not automatically detect a text column."}))
        sys.exit(1)
        
    texts = df[text_col].dropna().astype(str).tolist()
    if len(texts) > 500:
        import random
        random.seed(42)
        texts = random.sample(texts, 500)
        
    results = run_multilingual_clustering(texts)
    
    output = {
        "engine": "Cloud Multilingual Vector Engine (E5-Large + Llama-3)",
        "analyzed_column": text_col,
        "sample_size": len(texts),
        "mathematically_proven_intents": results
    }
    
    print(json.dumps(output))

if __name__ == "__main__":
    main()
