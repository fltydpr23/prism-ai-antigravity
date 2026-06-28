"use client";

import PrismHeader from "@/components/PrismHeader";
import PrismFooter from "@/components/PrismFooter";
import { Lock, Activity, Zap, Database, Terminal, Webhook } from "lucide-react";
import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#05050A] text-white selection:bg-emerald-500/30 flex flex-col">
      <PrismHeader onStart={() => {}} />

      <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8 lg:gap-16 px-6 pt-32 pb-24">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-8 hidden md:flex sticky top-32 h-[calc(100vh-8rem)] overflow-y-auto pr-6 border-r border-white/5">
          <div>
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Getting Started</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="#introduction" className="text-sm font-medium text-emerald-400">Introduction</Link>
              <Link href="#authentication" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Authentication</Link>
              <Link href="#rate-limits" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Rate Limits</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Endpoints</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="#ingest-feedback" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Ingest Feedback</Link>
              <Link href="#ingest-telemetry" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Ingest Telemetry</Link>
              <Link href="#trigger-analysis" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Trigger Analysis</Link>
              <Link href="#retrieve-results" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Retrieve Results</Link>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Webhooks</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="#webhooks" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Events & Retries</Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 max-w-3xl flex flex-col gap-12 text-white/80">
          
          {/* Header */}
          <div className="border-b border-white/10 pb-8" id="introduction">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Prism API Reference</h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Welcome to the Prism API. The Prism API provides programmatic access to our Consumer Intelligence engine, allowing you to ingest raw feedback, trigger analyses, and retrieve executive-ready insights.
            </p>
          </div>

          {/* Authentication */}
          <section id="authentication" className="flex flex-col gap-4 scroll-mt-32">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" /> Authentication
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              The Prism API uses API keys to authenticate requests. You can view and manage your API keys in the Prism Dashboard under <strong>Workspace Settings {'>'} API Keys</strong>. Provide your API key as the bearer token value in the <code className="bg-white/5 text-emerald-300 px-1.5 py-0.5 rounded text-xs">Authorization</code> header.
            </p>
            <div className="bg-[#0A0A0E] border border-white/10 rounded-xl p-4 overflow-x-auto my-2">
              <pre className="text-[13px] font-mono text-white/90">
                <span className="text-emerald-400">Authorization:</span> Bearer prism_live_xxxxxxxxxxxxxxxxx
              </pre>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200 flex flex-col gap-2">
              <strong className="font-semibold text-amber-400">Warning</strong>
              Your API keys carry many privileges. Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
            </div>
          </section>

          {/* Endpoints */}
          <div className="h-px bg-white/5 my-4" />

          {/* Ingest Feedback */}
          <section id="ingest-feedback" className="flex flex-col gap-4 scroll-mt-32">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" /> 1. Ingest Feedback
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Upload raw customer feedback (reviews, survey responses, support tickets) to a specific project.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">POST</span>
              <code className="text-sm font-mono text-white/60">/projects/{'{project_id}'}/feedback</code>
            </div>

            <div className="bg-[#0A0A0E] border border-white/10 rounded-xl overflow-hidden my-2">
              <div className="border-b border-white/10 px-4 py-2 bg-white/[0.02] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white/40" />
                <span className="text-xs font-mono text-white/50">cURL Example</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-[13px] font-mono text-white/80 leading-relaxed">
<span className="text-fuchsia-400">curl</span> -X POST https://api.prismintel.co/v1/projects/prj_123/feedback \<br/>
  -H <span className="text-emerald-300">"Authorization: Bearer prism_live_abc123"</span> \<br/>
  -H <span className="text-emerald-300">"Content-Type: application/json"</span> \<br/>
  -d <span className="text-emerald-300">'{'{'}
    "source": "typeform",
    "data": [
      {'{'}
        "text": "The app is great but it crashes on checkout.",
        "user_id": "usr_9982",
        "timestamp": "2026-06-28T14:32:00Z"
      {'}'}
    ]
  {'}'}'</span>
                </pre>
              </div>
            </div>
          </section>

          {/* Ingest Telemetry */}
          <section id="ingest-telemetry" className="flex flex-col gap-4 scroll-mt-32 pt-8">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-400" /> 2. Ingest Behavioral Telemetry
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Send behavioral events to correlate what users <em>do</em> with what they <em>say</em>. This powers the <strong>Say vs. Do Gaps</strong> engine. The <code className="text-emerald-300 text-xs font-mono">user_id</code> must match the ID used in feedback ingestion.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">POST</span>
              <code className="text-sm font-mono text-white/60">/telemetry/events</code>
            </div>

            <div className="bg-[#0A0A0E] border border-white/10 rounded-xl overflow-hidden my-2">
              <div className="border-b border-white/10 px-4 py-2 bg-white/[0.02] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white/40" />
                <span className="text-xs font-mono text-white/50">cURL Example</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-[13px] font-mono text-white/80 leading-relaxed">
<span className="text-fuchsia-400">curl</span> -X POST https://api.prismintel.co/v1/telemetry/events \<br/>
  -H <span className="text-emerald-300">"Authorization: Bearer prism_live_abc123"</span> \<br/>
  -H <span className="text-emerald-300">"Content-Type: application/json"</span> \<br/>
  -d <span className="text-emerald-300">'{'{'}
    "user_id": "usr_9982",
    "event_name": "checkout_abandoned",
    "properties": {'{'}
      "cart_value": 149.99,
      "device": "iOS"
    {'}'}
  {'}'}'</span>
                </pre>
              </div>
            </div>
          </section>

          {/* Trigger Analysis */}
          <section id="trigger-analysis" className="flex flex-col gap-4 scroll-mt-32 pt-8">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-400" /> 3. Trigger Analysis
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Trigger an asynchronous analysis run on the ingested feedback. Returns an <code className="text-emerald-300 text-xs font-mono">analysis_id</code> to query later, or optionally pushes to your <code className="text-emerald-300 text-xs font-mono">webhook_url</code>.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">POST</span>
              <code className="text-sm font-mono text-white/60">/projects/{'{project_id}'}/analyze</code>
            </div>
          </section>
          
          <div className="h-px bg-white/5 my-8" />

          {/* Webhooks */}
          <section id="webhooks" className="flex flex-col gap-4 scroll-mt-32">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <Webhook className="w-5 h-5 text-emerald-400" /> Webhooks
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Prism can push events to your servers when certain actions occur, such as when an automated scheduled analysis completes. Configure webhooks in your Dashboard.
            </p>
            <ul className="list-disc pl-5 text-sm text-white/60 flex flex-col gap-2 mt-2">
              <li><code className="font-mono text-emerald-300 bg-white/5 px-1.5 py-0.5 rounded">analysis.completed</code></li>
              <li><code className="font-mono text-emerald-300 bg-white/5 px-1.5 py-0.5 rounded">analysis.failed</code></li>
              <li><code className="font-mono text-emerald-300 bg-white/5 px-1.5 py-0.5 rounded">data.ingestion_limit_reached</code></li>
            </ul>
          </section>

        </div>
      </main>

      <PrismFooter onStart={() => {}} />
    </div>
  );
}
