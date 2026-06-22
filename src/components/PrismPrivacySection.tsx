"use client";

import { useRef } from "react";
import { ShieldCheck, Database, Cpu, Lock, FileText, Trash2 } from "lucide-react";
import { motion, useInView } from "framer-motion";

export default function PrismPrivacySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-32 px-6 relative overflow-hidden bg-[#05050A] border-t border-white/5">
      {/* Background ambient light */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        {/* ── Left Column: Typography & Content ───────────────────────────────── */}
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] text-[11px] font-semibold tracking-widest uppercase text-emerald-400 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise-Grade Privacy
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-white mb-6 leading-[1.1]">
              Zero retention.<br />
              <span className="text-white/40">Engineered for trust.</span>
            </h2>
            <p className="text-lg text-white/50 leading-relaxed mb-12">
              We know you're trusting us with sensitive customer data, support tickets, and private feedback. Prism is built on a strict, hardware-level privacy architecture that guarantees your data never becomes our data.
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                icon: Trash2,
                title: "1-Hour Auto-Destruct",
                desc: "Uploaded files are held in temporary volatile storage. Within 60 minutes of ingestion, the source files physically auto-destruct.",
                color: "text-red-400"
              },
              {
                icon: Cpu,
                title: "In-Memory Processing",
                desc: "Your data is never written to a persistent database. The LLM analysis pipeline executes entirely in secure RAM.",
                color: "text-emerald-400"
              },
              {
                icon: Lock,
                title: "AES-256 Encrypted Output",
                desc: "Only the final synthesized strategic insights are stored, secured with enterprise-grade encryption at rest.",
                color: "text-cyan-400"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-4"
              >
                <div className={`mt-1 p-2 rounded-lg bg-white/[0.03] border border-white/5 shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">{item.title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Right Column: 3D Isometric Hardware Breakdown ─────────────────── */}
        <div 
          ref={containerRef}
          className="relative h-[600px] w-full flex items-center justify-center pointer-events-none"
          style={{ perspective: "1200px" }}
        >
          <motion.div 
            className="relative w-[300px] h-[300px]"
            initial={{ rotateX: 60, rotateZ: -45, scale: 0.8 }}
            animate={isInView ? { rotateX: 60, rotateZ: -45, scale: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top Layer: Raw Data Input */}
            <motion.div
              initial={{ translateZ: 0, opacity: 0 }}
              animate={isInView ? { translateZ: 140, opacity: 1 } : {}}
              transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 rounded-2xl border border-white/20 bg-white/[0.03] backdrop-blur-md shadow-[0_0_50px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center overflow-hidden"
              style={{ transformStyle: "preserve-3d" }}
            >
              <FileText className="w-12 h-12 text-white/40 mb-4" />
              <div className="w-3/4 h-2 bg-white/10 rounded-full mb-2" />
              <div className="w-1/2 h-2 bg-white/10 rounded-full" />
              
              {/* Floating Tag */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1 }}
                className="absolute -right-12 top-4 px-3 py-1 rounded bg-red-500/20 border border-red-500/30 text-[10px] text-red-400 font-mono rotate-90"
                style={{ transform: "translateZ(20px) rotateZ(45deg) rotateX(-90deg)" }}
              >
                TTL: 60m
              </motion.div>
            </motion.div>

            {/* Middle Layer: Engine */}
            <motion.div
              initial={{ translateZ: 0, opacity: 0 }}
              animate={isInView ? { translateZ: 0, opacity: 1 } : {}}
              transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 rounded-2xl border border-emerald-500/30 bg-[#0a120e] shadow-[0_0_80px_rgba(16,185,129,0.15)] flex items-center justify-center overflow-hidden"
            >
              {/* Grid background */}
              <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              <Cpu className="w-16 h-16 text-emerald-400 relative z-10 animate-pulse" />
            </motion.div>

            {/* Bottom Layer: Encrypted Output */}
            <motion.div
              initial={{ translateZ: 0, opacity: 0 }}
              animate={isInView ? { translateZ: -140, opacity: 1 } : {}}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 rounded-2xl border border-cyan-500/20 bg-cyan-950/40 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.1)]"
            >
              <Database className="w-12 h-12 text-cyan-400/50 mb-4" />
              <div className="font-mono text-xs text-cyan-400/60 text-center space-y-1">
                <p>****************</p>
                <p>********</p>
                <p>************</p>
              </div>
            </motion.div>

            {/* Connecting Lasers/Lines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 1.2 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Vertical connecting line */}
              <div className="absolute w-[1px] h-[300px] bg-gradient-to-b from-white/20 via-emerald-500/50 to-cyan-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ transform: "translateZ(0px) rotateX(90deg)" }} />
            </motion.div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
