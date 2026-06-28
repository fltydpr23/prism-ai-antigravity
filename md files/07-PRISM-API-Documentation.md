# Prism API Reference

Welcome to the Prism API. The Prism API provides programmatic access to our Consumer Intelligence engine, allowing you to ingest raw feedback, trigger analyses, and retrieve executive-ready insights.

Our API is organized around REST. Our API has predictable resource-oriented URLs, accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.

---

## Authentication

The Prism API uses API keys to authenticate requests. You can view and manage your API keys in the Prism Dashboard under **Workspace Settings > API Keys**.

Authentication to the API is performed via HTTP Bearer Auth. Provide your API key as the bearer token value in the `Authorization` header.

```bash
Authorization: Bearer prism_live_xxxxxxxxxxxxxxxxx
```

> [!WARNING]
> Your API keys carry many privileges. Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.

---

## Base URL

All API requests should be made to the following base URL:

```text
https://api.prismintel.co/v1
```

---

## Rate Limits

Prism API rate limits are applied per workspace. 
- **Standard (Pro):** 100 requests per minute
- **Enterprise:** Custom limits (default 1,000 requests per minute)

When a rate limit is exceeded, the API will return a `429 Too Many Requests` response.

---

## 1. Ingest Feedback

Upload raw customer feedback (reviews, survey responses, support tickets) to a specific project.

**Endpoint:** `POST /projects/{project_id}/feedback`

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `source` | `string` | The source of the feedback (e.g., `app_store`, `zendesk`, `typeform`). |
| `data` | `array` | Array of feedback objects containing `text`, `timestamp`, and optional `user_id`. |
| `language` | `string` | (Optional) Explicit language code. If omitted, Prism auto-detects. |

### Request Example
```bash
curl -X POST https://api.prismintel.co/v1/projects/prj_123/feedback \
  -H "Authorization: Bearer prism_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "typeform",
    "data": [
      {
        "text": "The app is great but it crashes on checkout.",
        "user_id": "usr_9982",
        "timestamp": "2026-06-28T14:32:00Z"
      }
    ]
  }'
```

---

## 2. Ingest Behavioral Telemetry (Say vs. Do)

Send behavioral events to correlate what users *do* with what they *say*. This powers the **Say vs. Do Gaps** engine.

**Endpoint:** `POST /telemetry/events`

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `user_id` | `string` | The unique identifier for the user (must match the `user_id` in feedback ingestion). |
| `event_name` | `string` | The action performed (e.g., `subscription_cancelled`, `cart_abandoned`). |
| `properties` | `object` | Key-value pairs providing context to the event. |

### Request Example
```bash
curl -X POST https://api.prismintel.co/v1/telemetry/events \
  -H "Authorization: Bearer prism_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "usr_9982",
    "event_name": "checkout_abandoned",
    "properties": {
      "cart_value": 149.99,
      "device": "iOS"
    }
  }'
```

---

## 3. Trigger Analysis

Trigger an asynchronous analysis run on the ingested feedback. 

**Endpoint:** `POST /projects/{project_id}/analyze`

### Parameters
| Name | Type | Description |
| :--- | :--- | :--- |
| `mode` | `string` | The analysis framework to apply (e.g., `standard`, `churn_risk`, `competitor_teardown`). |
| `timeframe` | `string` | (Optional) The time period to analyze (e.g., `last_30_days`). |
| `webhook_url` | `string` | (Optional) URL to receive a POST request when the analysis is complete. |

### Response
Returns an `analysis_id` and a status of `processing`.

---

## 4. Retrieve Analysis Results

Fetch the fully structured JSON report from a completed analysis.

**Endpoint:** `GET /analyses/{analysis_id}`

### Response Example
```json
{
  "id": "ana_789",
  "status": "completed",
  "prism_score": 73,
  "insights": {
    "churn_signals": [
      {
        "issue": "Hidden Surge Pricing",
        "severity": "critical",
        "verbatim": "all good but sometimes surge charges will added"
      }
    ],
    "say_vs_do_gaps": [
      {
        "observation": "Users claim high satisfaction but exhibit 40% cart abandonment on iOS.",
        "confidence": 0.88
      }
    ]
  }
}
```

---

## Webhooks

Prism can push events to your servers when certain actions occur, such as when an automated scheduled analysis completes. Configure webhooks in your Dashboard or pass a `webhook_url` when triggering an analysis.

### Event Types
- `analysis.completed`
- `analysis.failed`
- `data.ingestion_limit_reached`
