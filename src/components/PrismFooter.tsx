"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

// ─── Text Scramble Hook ───────────────────────────────────────────────────────
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@.";

function useScramble(target: string, active: boolean) {
  const [display, setDisplay] = useState(target);
  const frame = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { setDisplay(target); return; }
    frame.current = 0;
    const iterations = target.length * 2;

    const animate = () => {
      setDisplay(
        target.split("").map((char, i) => {
          if (char === " ") return " ";
          if (i < frame.current / 2) return target[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("")
      );
      frame.current += 0.5;
      if (frame.current < iterations) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, target]);

  return display;
}

// ─── Scramble Link ────────────────────────────────────────────────────────────
function ScrambleLink({ label, href, isEmail = false }: { label: string; href: string; isEmail?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const display = useScramble(label, hovered);

  return isEmail ? (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-white hover:text-emerald-400 transition-colors font-mono tracking-wide"
    >
      {display}
    </a>
  ) : (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-white hover:text-emerald-400 transition-colors font-mono tracking-wide"
    >
      {display}
    </Link>
  );
}

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
      {/* ── Brutalist CTA ───────────────────────────────────────────────────── */}
      <section ref={ctaRef} className="px-6 py-32 border-t border-white/10 bg-black relative">
        <div className="max-w-7xl mx-auto flex flex-col items-start gap-12">

          <div className="flex flex-col gap-3 overflow-hidden">
            {/* Label */}
            <motion.span
              variants={FADE_UP}
              initial="hidden"
              animate={ctaInView ? "visible" : "hidden"}
              custom={0}
              className="text-[10px] font-mono tracking-widest text-white/40 uppercase"
            >
              ■ 47,000+ SIGNALS PROCESSED
            </motion.span>

            {/* Line 1 */}
            <div className="overflow-hidden">
              <motion.h2
                variants={FADE_UP}
                initial="hidden"
                animate={ctaInView ? "visible" : "hidden"}
                custom={0.1}
                className="text-5xl sm:text-7xl font-bold tracking-tighter text-white uppercase leading-[0.95]"
              >
                Consumer truth.
              </motion.h2>
            </div>

            {/* Line 2 */}
            <div className="overflow-hidden">
              <motion.h2
                variants={FADE_UP}
                initial="hidden"
                animate={ctaInView ? "visible" : "hidden"}
                custom={0.22}
                className="text-5xl sm:text-7xl font-bold tracking-tighter text-white uppercase leading-[0.95]"
              >
                Research-grade
              </motion.h2>
            </div>

            {/* Line 3 — muted */}
            <div className="overflow-hidden">
              <motion.h2
                variants={FADE_UP}
                initial="hidden"
                animate={ctaInView ? "visible" : "hidden"}
                custom={0.34}
                className="text-5xl sm:text-7xl font-bold tracking-tighter text-white/25 uppercase leading-[0.95]"
              >
                Precision.
              </motion.h2>
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            variants={FADE_UP}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            custom={0.5}
          >
            <button
              onClick={onStart}
              className="group flex items-center gap-4 border border-white px-8 py-6 text-sm font-mono tracking-widest text-white uppercase hover:bg-white hover:text-black transition-colors duration-200"
            >
              [ RUN YOUR FIRST REPORT ]
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Editorial Footer ─────────────────────────────────────────────────── */}
      <footer ref={footerRef} className="bg-black pt-32 pb-8 px-6 md:px-12 border-t border-white/10 overflow-hidden w-full">
        <div className="w-full flex flex-col gap-32">

          {/* Top: Brutalist Email Grid (Pushed to the Right) */}
          <div className="w-full flex justify-end">
            <motion.div
              variants={FADE_RIGHT}
              initial="hidden"
              animate={footerInView ? "visible" : "hidden"}
              custom={0}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16 w-full lg:w-[80%]"
            >
              {[
                {
                  section: "INQUIRIES",
                  items: [
                    {
                      label: "[ ] HELLO@PRISMINTEL.CO",
                      href: "mailto:hello@prismintel.co?subject=Partnership%20%2F%20Enterprise%20Inquiry&body=Hi%20Prism%20team%2C%0A%0AI%27d%20like%20to%20explore%20how%20Prism%20can%20work%20for%20our%20organisation.%20Could%20we%20set%20up%20a%20quick%20call%3F%0A%0A%5BYour%20name%20%26%20company%5D",
                      email: true,
                    },
                    { label: "Enterprise & Partnerships", href: "#", email: false, muted: true },
                  ],
                },
                {
                  section: "RESEARCH",
                  items: [
                    {
                      label: "[ ] RESEARCH@PRISMINTEL.CO",
                      href: "mailto:research@prismintel.co?subject=Custom%20Research%20Project%20Brief&body=Hi%20Prism%20Research%2C%0A%0AWe%27re%20looking%20for%20a%20custom%20consumer%20intelligence%20model%20for%20a%20specific%20brief.%20Happy%20to%20share%20more%20details%20on%20a%20call.%0A%0A%5BYour%20name%2C%20agency%20%26%20project%20overview%5D",
                      email: true,
                    },
                    { label: "Custom Models & Agency Projects", href: "#", email: false, muted: true },
                  ],
                },
                {
                  section: "CLIENT SERVICES",
                  items: [
                    {
                      label: "[ ] SUPPORT@PRISMINTEL.CO",
                      href: "mailto:support@prismintel.co?subject=Support%20Request&body=Hi%20Prism%20Support%2C%0A%0AI%20need%20help%20with%20the%20following%3A%0A%0A%5BDescribe%20your%20issue%20or%20question%5D",
                      email: true,
                    },
                    { label: "Technical Help & Billing", href: "#", email: false, muted: true },
                  ],
                },
                {
                  section: "SYSTEM",
                  items: [
                    { label: "[ ] VIEW_PRICING", href: "#pricing", email: false },
                    { label: "[ ] REPORT_ARCHIVE", href: "/history", email: false },
                  ],
                },
              ].map((col, ci) => (
                <motion.div
                  key={col.section}
                  variants={FADE_UP}
                  initial="hidden"
                  animate={footerInView ? "visible" : "hidden"}
                  custom={0.1 + ci * 0.1}
                  className="flex flex-col gap-3 text-xs whitespace-nowrap"
                >
                  <span className="text-white/25 font-mono tracking-widest mb-2">■ {col.section}</span>
                  {col.items.map((item) =>
                    item.muted ? (
                      <span key={item.label} className="text-white/35 font-mono">{item.label}</span>
                    ) : (
                      <ScrambleLink key={item.label} label={item.label} href={item.href} isEmail={item.email} />
                    )
                  )}
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
                <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                <Link href="#" className="hover:text-white transition-colors">System Status</Link>
              </div>
            </div>
          </motion.div>

        </div>
      </footer>
    </>
  );
}
