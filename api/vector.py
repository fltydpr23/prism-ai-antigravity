from http.server import BaseHTTPRequestHandler
import json
import warnings
import pandas as pd
import numpy as np
import io
import os
import requests
import traceback
from sklearn.cluster import KMeans

# Suppress all warnings
warnings.filterwarnings("ignore")

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

def get_together_embeddings(texts):
    api_key = os.environ.get("TOGETHER_API_KEY")
    if not api_key:
        raise ValueError("TOGETHER_API_KEY not found in Vercel env vars!")
        
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
            "model": "intfloat/multilingual-e5-large-instruct",
            "input": chunk
        }
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code != 200:
            raise Exception(f"Together Embedding API Error: {res.text}")
        data = res.json()
        
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
    
    best_match = candidate_labels[0]
    for label in candidate_labels:
        if label.lower() in reply.lower():
            best_match = label
            break
            
    return best_match

def run_multilingual_clustering(texts, num_clusters=8):
    try:
        embeddings = get_together_embeddings(texts)
        
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
        
    except Exception as e:
        return {"error": f"Clustering failed: {str(e)}\n{traceback.format_exc()}"}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            raw_text = post_data.decode('utf-8')
            
            try:
                if raw_text.strip().startswith('['):
                    df = pd.read_json(io.StringIO(raw_text))
                else:
                    df = pd.read_csv(io.StringIO(raw_text))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Failed to parse dataset: {str(e)}"}).encode('utf-8'))
                return

            text_col = detect_text_column(df)
            if not text_col:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Could not automatically detect a text column."}).encode('utf-8'))
                return
                
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
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(output).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Server error: {str(e)}\n{traceback.format_exc()}"}).encode('utf-8'))
