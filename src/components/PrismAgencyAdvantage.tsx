"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Search, TrendingUp, Zap } from "lucide-react";

const CARDS = [
  {
    icon: Search,
    title: "Pre-Pitch Intelligence",
    description: "Audit a prospect's public app reviews and support data before the first meeting. Walk in with the answers.",
  },
  {
    icon: TrendingUp,
    title: "Retainer Expansion",
    description: "Continuously monitor client data streams to detect new friction points, instantly generating upsell opportunities.",
  },
  {
    icon: Zap,
    title: "Automated Deliverables",
    description: "Turn thousands of unstructured feedback points into boardroom-ready white-label reports, cutting analyst hours by 90%.",
  },
];

function GlowCard({ card, index, inView }: { card: typeof CARDS[0], index: number, inView: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col p-8 rounded-2xl border border-white/[0.05] bg-[#0d0d0d] overflow-hidden group"
    >
      {/* ── Spotlight Glow Effect ─────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(52,211,153,0.1), transparent 40%)`,
        }}
      />
      
      {/* Inner border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05)`,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1), transparent 40%)`,
          WebkitMaskImage: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-5 h-full">
        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
          <card.icon className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white/90 mb-3">
            {card.title}
          </h3>
          <p className="text-[15px] leading-relaxed text-white/40">
            {card.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function PrismAgencyAdvantage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-32 border-b border-white/5 bg-[#050505] relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] pointer-events-none rounded-full" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-[11px] font-semibold tracking-widest uppercase text-emerald-400 mb-6">
            For Agencies & Consultancies
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tighter text-white mb-5">
            The unfair advantage for<br />
            <span className="text-white/35">data-driven consultancies.</span>
          </h2>
          <p className="text-lg text-white/45 leading-relaxed max-w-xl mx-auto">
            Prism is the secret weapon for top-tier agencies turning raw client feedback into highly profitable strategic retainers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map((card, i) => (
            <GlowCard key={i} card={card} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
