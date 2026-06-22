"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Server } from "lucide-react";
import PrismFooter from "@/components/PrismFooter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col text-white selection:bg-emerald-500/30">
      
      {/* Mini Nav */}
      <nav className="h-20 border-b border-white/5 flex items-center px-6 md:px-12 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </nav>

      {/* Hero */}
      <header className="pt-24 pb-16 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] text-[11px] font-semibold tracking-widest uppercase text-emerald-400 mb-6">
          <ShieldCheck className="w-3.5 h-3.5" /> Data Protection & Privacy
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
          Zero Retention.<br/>Total Sovereignty.
        </h1>
        <p className="text-lg text-white/40 leading-relaxed">
          At Prism, privacy is not a compliance checklist—it is an architectural guarantee. We operate under a strict zero-retention model, explicitly designed to comply with the Indian Digital Personal Data Protection (DPDP) Act, 2023.
        </p>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 md:px-12 pb-32 max-w-4xl mx-auto w-full prose prose-invert prose-emerald max-w-none">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 not-prose">
          <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <Server className="w-6 h-6 text-emerald-400 mb-4" />
            <h3 className="text-white font-medium mb-2">Data Residency</h3>
            <p className="text-sm text-white/40">100% of processing occurs in AWS ap-south-1 (Mumbai). Your data never leaves Indian borders.</p>
          </div>
          <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <Lock className="w-6 h-6 text-cyan-400 mb-4" />
            <h3 className="text-white font-medium mb-2">AES-256 Encryption</h3>
            <p className="text-sm text-white/40">All transit is secured via TLS 1.3. Output insights are encrypted at rest using AES-256 standards.</p>
          </div>
          <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <ShieldCheck className="w-6 h-6 text-rose-400 mb-4" />
            <h3 className="text-white font-medium mb-2">1-Hour TTL</h3>
            <p className="text-sm text-white/40">Raw source data is permanently destroyed from our volatile memory 60 minutes after ingestion.</p>
          </div>
        </div>

        <section className="space-y-12 text-white/60">
          <div>
            <h2 className="text-2xl text-white font-semibold mb-4 tracking-tight">1. Processing Under the DPDP Act, 2023</h2>
            <p className="mb-4">
              Prism Intelligence Inc. operates strictly as a <strong>Data Processor</strong> under the Digital Personal Data Protection Act, 2023. You, the Client, remain the Data Fiduciary. We do not determine the purpose or means of processing personal data. Our engine exists solely to synthesize intelligence from the datasets you authorize.
            </p>
            <p>
              In adherence to the principles of data minimization and purpose limitation, Prism's architecture inherently prevents the stockpiling of Principal Data. We extract thematic intelligence, sentiment polarity, and aggregate metrics without associating these insights to specific Data Principals.
            </p>
          </div>

          <div>
            <h2 className="text-2xl text-white font-semibold mb-4 tracking-tight">2. Information Technology (Reasonable Security Practices) Rules, 2011</h2>
            <p className="mb-4">
              Pursuant to Section 43A of the Information Technology Act, 2000, we implement ISO/IEC 27001-aligned comprehensive documented information security programs (ISMS). 
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Zero-Retention Engine:</strong> We do not write raw CSV, JSON, or PDF uploads to persistent databases. Analysis is conducted in-memory.</li>
              <li><strong>Auto-Destruction:</strong> Temporary storage buckets handling the upload pipeline enforce a strict 1-hour Time-To-Live (TTL) lifecycle.</li>
              <li><strong>No LLM Training:</strong> Prism explicitly disables telemetry and training. Your private customer data is <em>never</em> used to train foundation models.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl text-white font-semibold mb-4 tracking-tight">3. Incident Response & Breach Notification</h2>
            <p>
              In the highly unlikely event of a security breach compromising the encrypted intelligence outputs, Prism maintains a 6-hour internal SLA for notifying the Indian Computer Emergency Response Team (CERT-In) and affected Data Fiduciaries, complying with the latest CERT-In directives.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-100/80">
            <h3 className="text-emerald-400 font-semibold mb-2">Grievance Officer</h3>
            <p className="text-sm mb-4">
              In accordance with the Information Technology Act, 2000 and rules made there under, the name and contact details of the Grievance Officer are provided below:
            </p>
            <p className="text-sm font-mono">
              Mr. Security Operations<br/>
              Prism Intelligence Inc.<br/>
              Chennai, India 600020<br/>
              Email: legal@prismintel.co
            </p>
          </div>

        </section>
      </main>

      <PrismFooter onStart={() => window.location.href = '/'} />
    </div>
  );
}
