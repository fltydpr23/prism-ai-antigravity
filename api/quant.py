from http.server import BaseHTTPRequestHandler
import json
import warnings
import pandas as pd
import numpy as np
import io

# Suppress all warnings so they don't pollute the JSON output
warnings.filterwarnings("ignore")

def detect_columns(df):
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
    date_cols = df.select_dtypes(include=['datetime', 'datetimetz']).columns.tolist()

    # Sometimes dates are strings, try to parse
    for col in cat_cols:
        if 'date' in col.lower() or 'time' in col.lower():
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                if df[col].notna().mean() > 0.5:
                    cat_cols.remove(col)
                    date_cols.append(col)
            except:
                pass
                
    return num_cols, cat_cols, date_cols

def run_pca(df, num_cols):
    if len(num_cols) < 2:
        return None
    try:
        from sklearn.decomposition import PCA
        from sklearn.preprocessing import StandardScaler
        
        # Fill NAs
        data = df[num_cols].fillna(df[num_cols].mean())
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(data)
        
        n_comp = min(3, len(num_cols))
        pca = PCA(n_components=n_comp)
        pca.fit(scaled_data)
        
        variance = pca.explained_variance_ratio_.tolist()
        loadings = pd.DataFrame(pca.components_.T, columns=[f'PC{i+1}' for i in range(n_comp)], index=num_cols)
        
        # Get top feature for each PC
        top_features = []
        for i in range(n_comp):
            top_features.append({
                "component": f"Principal Component {i+1}",
                "variance_explained": f"{variance[i]*100:.2f}%",
                "top_driving_metric": loadings[f'PC{i+1}'].abs().idxmax()
            })
            
        return {
            "total_variance_explained": f"{sum(variance)*100:.2f}%",
            "components": top_features
        }
    except Exception as e:
        return None

def run_regression(df, num_cols, cat_cols):
    if len(num_cols) < 2:
        return None
    try:
        import statsmodels.api as sm
        
        # Pick target variable (heuristic: try 'revenue', 'score', 'rating', 'sales', else last num col)
        target = num_cols[-1]
        for col in num_cols:
            cl = col.lower()
            if 'score' in cl or 'rating' in cl or 'revenue' in cl or 'sales' in cl or 'price' in cl:
                target = col
                break
                
        features = [c for c in num_cols if c != target]
        if not features: return None
        
        data = df[features + [target]].dropna()
        if len(data) < 10: return None
        
        X = data[features]
        # Standardize features for comparable coefficients
        X = (X - X.mean()) / X.std()
        X = sm.add_constant(X)
        y = data[target]
        
        model = sm.OLS(y, X).fit()
        
        # Extract top 3 significant drivers
        pvalues = model.pvalues.drop('const', errors='ignore')
        coeffs = model.params.drop('const', errors='ignore')
        
        sig_drivers = pvalues[pvalues < 0.05].sort_values()
        
        drivers_list = []
        for feat in sig_drivers.index[:3]:
            drivers_list.append({
                "feature": feat,
                "coefficient_weight": round(coeffs[feat], 4),
                "p_value": round(pvalues[feat], 5),
                "impact_direction": "Positive" if coeffs[feat] > 0 else "Negative"
            })
            
        return {
            "target_variable": target,
            "r_squared": round(model.rsquared, 4),
            "adjusted_r_squared": round(model.rsquared_adj, 4),
            "top_drivers": drivers_list
        }
    except Exception as e:
        return None

def run_chisquare(df, cat_cols):
    if len(cat_cols) < 2:
        return None
    try:
        from scipy.stats import chi2_contingency
        
        # Find 2 categorical columns with manageable unique values (between 2 and 20)
        valid_cats = [c for c in cat_cols if 1 < df[c].nunique() <= 20]
        if len(valid_cats) < 2: return None
        
        col1, col2 = valid_cats[0], valid_cats[1]
        contingency = pd.crosstab(df[col1], df[col2])
        chi2, p, dof, ex = chi2_contingency(contingency)
        
        return {
            "tested_variables": [col1, col2],
            "chi_square_statistic": round(chi2, 4),
            "p_value": round(p, 6),
            "is_significant": bool(p < 0.05)
        }
    except Exception as e:
        return None

def run_survival(df, num_cols, cat_cols):
    try:
        from lifelines import KaplanMeierFitter
        
        # Look for duration
        duration_col = None
        for col in num_cols:
            cl = col.lower()
            if 'tenure' in cl or 'duration' in cl or 'month' in cl or 'time' in cl or 'age' in cl:
                duration_col = col
                break
                
        # Look for event
        event_col = None
        for col in num_cols + cat_cols:
            cl = col.lower()
            if 'churn' in cl or 'event' in cl or 'status' in cl or 'dead' in cl:
                event_col = col
                break
                
        if not duration_col or not event_col:
            return None
            
        data = df[[duration_col, event_col]].dropna()
        if len(data) < 10: return None
        
        # Convert event to boolean/integer 0/1
        if data[event_col].dtype == 'object':
            val_counts = data[event_col].value_counts()
            # assume minority class is the event
            event_val = val_counts.index[-1]
            E = data[event_col] == event_val
        else:
            E = data[event_col].astype(bool)
            
        T = data[duration_col]
        
        kmf = KaplanMeierFitter()
        kmf.fit(T, event_observed=E)
        
        # Get median survival time
        median_survival = kmf.median_survival_time_
        
        # Get probabilities at key intervals (25%, 50%, 75% of max time)
        max_t = T.max()
        times = [max_t * 0.25, max_t * 0.5, max_t * 0.75]
        probs = kmf.predict(times).to_dict()
        
        return {
            "duration_variable": duration_col,
            "event_variable": event_col,
            "median_survival_time": None if np.isinf(median_survival) else round(median_survival, 2),
            "survival_probabilities": {f"At time {round(k, 1)}": f"{v*100:.1f}%" for k, v in probs.items()}
        }
    except Exception as e:
        return None

def run_timeseries(df, date_cols, num_cols):
    if not date_cols or not num_cols:
        return None
    try:
        import statsmodels.api as sm
        
        date_col = date_cols[0]
        # target is either revenue/sales or just the first num col
        target = num_cols[0]
        for col in num_cols:
            cl = col.lower()
            if 'revenue' in cl or 'sales' in cl or 'price' in cl or 'volume' in cl:
                target = col
                break
                
        data = df[[date_col, target]].dropna().sort_values(by=date_col)
        data.set_index(date_col, inplace=True)
        
        # Resample to weekly or monthly to avoid noise (auto-detect frequency)
        if len(data) > 300:
            ts = data.resample('W').sum()
        else:
            ts = data.resample('M').sum()
            
        ts = ts[target].dropna()
        if len(ts) < 10: return None
        
        # Simple ARIMA (1,1,1) for baseline trend
        model = sm.tsa.arima.ARIMA(ts, order=(1,1,1))
        results = model.fit()
        
        forecast = results.forecast(steps=3)
        
        return {
            "time_variable": date_col,
            "target_variable": target,
            "historical_mean": round(ts.mean(), 2),
            "forecast_next_3_periods": [round(x, 2) for x in forecast.values.tolist()]
        }
    except Exception as e:
        return None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error(400, "Empty payload")
                return
                
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            # Use StringIO to read the CSV content
            if post_data.strip().startswith('['):
                df = pd.read_json(io.StringIO(post_data))
            else:
                df = pd.read_csv(io.StringIO(post_data))
                
            num_cols, cat_cols, date_cols = detect_columns(df)
            
            output = {
                "dataset_shape": {"rows": len(df), "columns": len(df.columns)},
                "basic_statistics": json.loads(df[num_cols].describe().to_json()) if num_cols else {},
                "models": {
                    "multivariate_driver_analysis": run_regression(df, num_cols, cat_cols),
                    "dependency_testing_chi_square": run_chisquare(df, cat_cols),
                    "dimensionality_reduction_pca": run_pca(df, num_cols),
                    "survival_analysis_kaplan_meier": run_survival(df, num_cols, cat_cols),
                    "time_series_forecasting": run_timeseries(df, date_cols, num_cols)
                }
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
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
