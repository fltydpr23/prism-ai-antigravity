"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { ArrowRight, Zap, Building2 } from "lucide-react";
import Link from "next/link";
import localFont from "next/font/local";

const basementGrotesque = localFont({
  src: "../../public/fonts/basement_grotesque/BasementGrotesque-Black_v1.202.otf",
  variable: "--font-basement",
});

const CUBIC_BEZIER: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Stagger config ───────────────────────────────────────────────────────────
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: CUBIC_BEZIER },
  }),
};

const FADE_LEFT: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, delay, ease: CUBIC_BEZIER },
  }),
};

const FADE_RIGHT: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, delay, ease: CUBIC_BEZIER },
  }),
};



// ─── Light show effects per-letter ────────────────────────────────────────────
const LIGHT_SHOW_PALETTES = [
  ["#ff0080", "#ff7700"],
  ["#ffff00", "#00ff88"],
  ["#00cfff", "#7c3aed"],
  ["#ff0080", "#7c3aed"],
  ["#00ff88", "#00cfff"],
  ["#ffffff", "#aabbff"],
  ["#ff9500", "#ff2d55"],
];

type LetterEffect = {
  gradient: string;
  glow: string;
  scale: number;
  rotate: number;
  delay: number;
};

function randomLetterEffect(i: number): LetterEffect {
  const palette = LIGHT_SHOW_PALETTES[Math.floor(Math.random() * LIGHT_SHOW_PALETTES.length)];
  const angle = Math.floor(Math.random() * 360);
  const glowColor = palette[0];
  const glowSize = 20 + Math.random() * 40;
  return {
    gradient: `linear-gradient(${angle}deg, ${palette[0]}, ${palette[1]})`,
    glow: `0 0 ${glowSize}px ${glowColor}88, 0 0 ${glowSize * 2}px ${glowColor}33`,
    scale: 0.98 + Math.random() * 0.1,
    rotate: (Math.random() - 0.5) * 4,
    delay: i * 60,
  };
}

// ─── Single interactive letter ────────────────────────────────────────────────
function PrismLetter({
  char, mouseRelX, letterIndex, totalLetters, showEffect, effect,
}: {
  char: string;
  mouseRelX: number;
  letterIndex: number;
  totalLetters: number;
  showEffect: boolean;
  effect: LetterEffect | null;
}) {
  const letterCentre = (letterIndex + 0.5) / totalLetters;
  const dist = Math.abs(mouseRelX - letterCentre);
  const radius = 0.22;
  const proximity = mouseRelX >= 0 ? Math.max(0, 1 - dist / radius) : 0;
  const isLit = proximity > 0.05;
  const hue = (letterIndex / totalLetters) * 300;

  const spotlightGrad = isLit
    ? `linear-gradient(135deg, hsl(${hue},100%,65%), hsl(${hue + 60},100%,60%), hsl(${hue + 120},100%,65%))`
    : "none";

  const activeGrad = showEffect && effect ? effect.gradient : spotlightGrad;
  const useGrad = (showEffect && effect) || isLit;

  return (
    <span
      className="inline-block relative"
      style={{
        backgroundImage: useGrad ? activeGrad : "none",
        backgroundClip: useGrad ? "text" : undefined,
        WebkitBackgroundClip: useGrad ? "text" : undefined,
        color: useGrad ? "transparent" : "white",
        textShadow: showEffect && effect
          ? effect.glow
          : isLit
            ? `0 0 ${20 * proximity}px hsla(${hue},100%,70%,${proximity * 0.8}), 0 0 ${50 * proximity}px hsla(${hue + 60},100%,65%,${proximity * 0.4})`
            : "none",
        transform: showEffect && effect
          ? `scale(${effect.scale}) rotate(${effect.rotate}deg)`
          : `scale(${1 + proximity * 0.04})`,
        transition: showEffect
          ? `all 0.4s cubic-bezier(0.16,1,0.3,1) ${effect?.delay ?? 0}ms`
          : "transform 0.08s ease, color 0.08s ease, text-shadow 0.1s ease",
        willChange: "transform, color",
      }}
    >
      {char}
    </span>
  );
}

// ─── Iridescent PRISM Wordmark ────────────────────────────────────────────────
function PrismWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [mouseRelX, setMouseRelX] = useState(-1);
  const [showEffect, setShowEffect] = useState(false);
  const [effects, setEffects] = useState<(LetterEffect | null)[]>([null, null, null, null, null]);
  const clickCount = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LETTERS = ["P", "R", "I", "S", "M"];

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMouseRelX(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, []);

  const handleMouseLeave = useCallback(() => setMouseRelX(-1), []);

  const handleClick = useCallback(() => {
    clickCount.current += 1;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (clickCount.current >= 2) {
      clickCount.current = 0;
      setEffects(LETTERS.map((_, i) => randomLetterEffect(i)));
      setShowEffect(true);
      resetTimer.current = setTimeout(() => {
        setShowEffect(false);
        setEffects([null, null, null, null, null]);
      }, 2800);
    } else {
      resetTimer.current = setTimeout(() => { clickCount.current = 0; }, 400);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("click", handleClick);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("click", handleClick);
    };
  }, [handleMouseMove, handleMouseLeave, handleClick]);

  return (
    <div
      ref={ref}
      className={`text-[11vw] md:text-[12vw] leading-[0.75] font-bold tracking-tighter uppercase select-none cursor-pointer flex ${basementGrotesque.className}`}
      title="Double-click for a light show"
    >
      {LETTERS.map((char, i) => (
        <PrismLetter
          key={i}
          char={char}
          mouseRelX={mouseRelX}
          letterIndex={i}
          totalLetters={LETTERS.length}
          showEffect={showEffect}
          effect={effects[i]}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  onStart: () => void;
}

export default function PrismFooter({ onStart }: Props) {
  const ctaRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });
  const footerInView = useInView(footerRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* ── Segmented CTA ───────────────────────────────────────────────────── */}
      <section ref={ctaRef} className="px-6 py-32 border-t border-white/5 bg-[#05050A] relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center">
          
          <motion.div
            variants={FADE_UP}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white mb-4">
              Stop reading reviews. Start making decisions.
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Choose the path that fits your pipeline. From self-serve analysis to custom enterprise models.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Card 1: Startups/Self-Serve */}
            <motion.div
              variants={FADE_UP}
              initial="hidden"
              animate={ctaInView ? "visible" : "hidden"}
              custom={0.2}
              className="group relative p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all duration-500 flex flex-col overflow-hidden"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none" />
              
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 shrink-0 group-hover:scale-105 transition-transform duration-500">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              
              <h3 className="text-2xl font-semibold tracking-tight text-white mb-3">Self-Serve Engine</h3>
              <p className="text-white/40 leading-relaxed mb-10 flex-1">
                Perfect for product managers and analysts. Upload your CSVs, configure your extraction parameters, and instantly generate boardroom-ready strategic reports.
              </p>
              
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white text-black font-semibold tracking-tight hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                Start Free Analysis <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Card 2: Enterprise/Agencies */}
            <motion.div
              variants={FADE_UP}
              initial="hidden"
              animate={ctaInView ? "visible" : "hidden"}
              custom={0.4}
              className="group relative p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] hover:border-cyan-500/30 transition-all duration-500 flex flex-col overflow-hidden"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none" />
              
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-8 shrink-0 group-hover:scale-105 transition-transform duration-500">
                <Building2 className="w-7 h-7 text-cyan-400" />
              </div>
              
              <h3 className="text-2xl font-semibold tracking-tight text-white mb-3">Enterprise & Agencies</h3>
              <p className="text-white/40 leading-relaxed mb-10 flex-1">
                For massive data streams and high-ticket clients. Get dedicated infrastructure, custom ingestion pipelines, and white-labeled PDF generation.
              </p>
              
              <a
                href="mailto:hello@prismintel.co?subject=Enterprise%20Inquiry"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/[0.05] border border-white/10 text-white font-semibold tracking-tight hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                Contact Sales <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ── Editorial Footer ─────────────────────────────────────────────────── */}
      <footer ref={footerRef} className="bg-black pt-32 pb-8 px-6 md:px-12 border-t border-white/10 overflow-hidden w-full">
        <div className="w-full flex flex-col gap-32">

          {/* Top: Enterprise Footer Links */}
          <div className="w-full flex justify-end">
            <motion.div
              variants={FADE_RIGHT}
              initial="hidden"
              animate={footerInView ? "visible" : "hidden"}
              custom={0}
              className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16 w-full lg:w-[80%]"
            >
              {[
                {
                  section: "Product",
                  items: [
                    { label: "Platform Overview", href: "#" },
                    { label: "Use Cases", href: "/use-cases" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "API Documentation", href: "#" },
                    { label: "Security & Trust", href: "#" },
                  ],
                },
                {
                  section: "Resources",
                  items: [
                    { label: "Case Studies", href: "/case-studies" },
                    { label: "Blog", href: "/blog" },
                    { label: "Intelligence Guide", href: "#" },
                    { label: "Help Center", href: "#" },
                  ],
                },
                {
                  section: "Company",
                  items: [
                    { label: "About Prism", href: "/about" },
                    { label: "Careers", href: "#" },
                    { label: "Partners", href: "#" },
                    { label: "Contact Us", href: "#" },
                  ],
                },
                {
                  section: "Contact",
                  items: [
                    { label: "Sales Inquiry", href: "mailto:sales@prismintel.co" },
                    { label: "Customer Support", href: "mailto:support@prismintel.co" },
                    { label: "Press & Media", href: "mailto:press@prismintel.co" },
                  ],
                },
              ].map((col, ci) => (
                <motion.div
                  key={col.section}
                  variants={FADE_UP}
                  initial="hidden"
                  animate={footerInView ? "visible" : "hidden"}
                  custom={0.1 + ci * 0.1}
                  className="flex flex-col gap-4 text-sm"
                >
                  <span className="text-white font-semibold mb-2">{col.section}</span>
                  {col.items.map((item) => (
                    <Link key={item.label} href={item.href} className="text-white/50 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom: Iridescent PRISM Wordmark & Footer Links */}
          <motion.div
            variants={FADE_UP}
            initial="hidden"
            animate={footerInView ? "visible" : "hidden"}
            custom={0.4}
            className="flex flex-col relative w-full"
          >
            <div className="w-full flex justify-between items-end border-b border-white/10 pb-8 mb-6">
              {/* Wordmark Left */}
              <div className="-ml-3">
                <PrismWordmark />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">
              <span>© 2026 Prism Intelligence Inc.</span>
              <div className="flex gap-6">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="#" className="hover:text-white transition-colors">System Status</Link>
              </div>
            </div>
          </motion.div>

        </div>
      </footer>
    </>
  );
}
