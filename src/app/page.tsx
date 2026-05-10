"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle2, ChevronRight, Activity, Key, Download, Copy } from "lucide-react";

type AnalysisResponse = {
  ok?: boolean;
  analysis?: {
    luneSignature?: {
      hue?: number;
    };
    [key: string]: any;
  } | null;
  saved?: boolean | null;
  id?: string | null;
  persistError?: string;
  error?: string;
};

const OLLAMA_PRESETS = [
  { label: "Reasoning — qwen2.5 14B", model: "qwen2.5:14b" },
] as const;

const EXAMPLES = [
  { label: "Agri-Tech Pitch", text: "\"Our new soil monitoring sensor helps sugarcane farmers in Maharashtra optimize water usage by up to 30%. With unpredictable monsoons, this predictive analytics tool is crucial for yield protection.\"" },
  { label: "App Review", text: "\"The UPI payment integration on the app is buttery smooth, but delivery via the local logistics partner to Tier-3 cities in Karnataka still takes over a week. Needs improvement.\"" },
  { label: "Creative Fiction", text: "\"The scent of roasted cumin and petrichor hung heavy in the humid Kerala air. As the first monsoon drops hit the tin roof, she poured herself another cup of strong filter coffee and opened the old ledger.\"" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [localLlmModel] = useState<string>(OLLAMA_PRESETS[0].model);
  const [persist, setPersist] = useState(false);
  const [skipLocalModel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  
  // Extract hue from response if available, fallback to 240 (blue)
  const hue = response?.analysis?.luneSignature?.hue ?? 240;

  useEffect(() => {
    // Update the aurora hue dynamically
    document.documentElement.style.setProperty('--aurora-hue', hue.toString());
  }, [hue]);

  async function submit() {
    if (!text.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          persist,
          skipLocalModel,
          localLlmModel,
        }),
      });
      const data = (await res.json()) as AnalysisResponse;
      setResponse(data);
    } catch {
      setResponse({ error: "Request failed." });
    } finally {
      setLoading(false);
    }
  }

  const analysis = response?.analysis;
  const localModel = analysis?.localModel?.parsed;

  const prismScore = (() => {
    if (!analysis) return 0;
    let score = 0;
    if (localModel?.executive_summary) score += 20;
    if (localModel?.themes?.length > 0) score += 20;
    if (localModel?.opportunities?.length > 0) score += 20;
    if (localModel?.emotions?.length > 0) score += 10;
    const density = analysis.metrics?.lexicalDensity || 0;
    if (density > 0.5) score += 15;
    const words = analysis.metrics?.wordCount || 0;
    if (words > 50) score += 15;
    return Math.min(100, score);
  })();

  const copyMarkdownReport = () => {
    if (!analysis || !localModel) return;
    let md = `# Prism Analysis Report\n\n`;
    if (localModel.executive_summary) {
      md += `## Executive Summary\n${localModel.executive_summary}\n\n`;
    }
    if (localModel.contradictions && localModel.contradictions.length > 0) {
      md += `## Contradictions\n`;
      localModel.contradictions.forEach((c: { conflict: string; explanation: string }) => {
        md += `- **${c.conflict}**: ${c.explanation}\n`;
      });
      md += `\n`;
    }
    if (localModel.themes && localModel.themes.length > 0) {
      md += `## Core Themes\n`;
      localModel.themes.forEach((t: { title: string; description: string; evidence: string }) => {
        md += `### ${t.title}\n${t.description}\n`;
        if (t.evidence) md += `> "${t.evidence}"\n\n`;
        else md += `\n`;
      });
    }
    if (localModel.opportunities && localModel.opportunities.length > 0) {
      md += `## Opportunities\n`;
      localModel.opportunities.forEach((o: { area: string; action: string }) => {
        md += `- **${o.area}**: ${o.action}\n`;
      });
      md += `\n`;
    }
    navigator.clipboard.writeText(md);
  };

  const downloadJson = () => {
    if (!response) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "prism-analysis.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <>
      <div className="aurora-bg" />
      <div className="flex min-h-screen flex-col items-center px-4 py-12 sm:py-24 relative z-10">
        <motion.main 
          layout
          className="flex w-full max-w-3xl flex-col gap-8"
        >
          <motion.header layout className="flex flex-col gap-6 text-center">
            {/* Eyebrow Label */}
            <motion.div layout className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
              <Sparkles className="w-3.5 h-3.5" />
              Prism &mdash; Built for India
            </motion.div>

            {/* Hero Headline */}
            <div className="flex flex-col gap-3">
              <motion.h1 layout className="text-5xl sm:text-7xl font-light tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 pb-2 leading-none">
                Turn messy feedback<br/>into clear action.
              </motion.h1>
              <motion.p layout className="text-base sm:text-lg font-light text-white/60 max-w-lg mx-auto leading-relaxed">
                Paste customer reviews, survey responses, or chat exports.<br/>
                Get themes, emotions, and opportunities in 60 seconds.
              </motion.p>
            </div>

            {/* Trust tagline */}
            <motion.p layout className="text-xs text-white/30 tracking-wide">
              No dashboards. No setup. Just insights.
            </motion.p>

            {/* Origin / Feature strip */}
            <motion.div layout className="flex items-center justify-center gap-4 flex-wrap">
              {["WhatsApp-native", "Multilingual", "Hinglish-ready"].map((tag) => (
                <span key={tag} className="glass-pill px-4 py-1.5 text-xs text-white/60 font-medium">
                  {tag}
                </span>
              ))}
            </motion.div>
          </motion.header>

          {/* Divider */}
          <div className="w-full border-t border-white/5" />

          <motion.div 
            layout
            className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden"
          >
            {/* Input Section */}
            <div className="flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={text ? Math.min(12, text.split('\n').length + 2) : 5}
                placeholder="Paste telemetry or text to analyse..."
                className="w-full resize-none rounded-2xl bg-black/40 border border-white/5 px-6 py-5 font-light text-white/90 placeholder:text-white/20 focus:bg-black/60 focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/5 transition-all shadow-inner"
                style={{ backdropFilter: 'blur(10px)' }}
              />
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs text-white/40 flex items-center mr-2">Try an example:</span>
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setText(ex.text)}
                    className="glass-pill px-3 py-1.5 text-[10px] sm:text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-t border-white/10 pt-4">
              <div className="flex flex-col gap-3 w-full sm:w-auto">

                
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-inner">
                  <span className="text-xs font-medium text-white/80">Archive to Cloud</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={persist}
                    onClick={() => setPersist(!persist)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${persist ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-white/10'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm ring-0 transition-transform duration-300 ease-in-out ${persist ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/60'}`}
                    />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading || !text.trim()}
                className="group w-full sm:w-auto h-12 rounded-full bg-white text-black px-8 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Activity className="w-4 h-4" />
                  </motion.div>
                ) : "Run Sequence"}
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {response?.error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel border-red-500/30 bg-red-500/10 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                {response.error}
              </motion.div>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="flex flex-col gap-6"
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Analysis Complete
                  </div>
                  <div className="flex gap-2">
                    {response.saved === true && (
                      <div className="glass-pill px-3 py-1 text-xs text-emerald-300 flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        Saved {response.id ? `(${response.id.slice(0, 8)})` : ''}
                      </div>
                    )}
                    {response.persistError && (
                      <div className="glass-pill px-3 py-1 text-xs text-amber-300 flex items-center gap-1 border-amber-500/30">
                        <AlertCircle className="w-3 h-3" />
                        Save Failed
                      </div>
                    )}
                    <button onClick={copyMarkdownReport} className="glass-pill px-3 py-1 text-xs text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer">
                      <Copy className="w-3 h-3" />
                      Copy Report
                    </button>
                    <button onClick={downloadJson} className="glass-pill px-3 py-1 text-xs text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer">
                      <Download className="w-3 h-3" />
                      Export JSON
                    </button>
                  </div>
                </div>

                {/* Executive Summary */}
                {localModel?.executive_summary && (
                  <motion.div className="glass-panel p-6 sm:p-8 rounded-3xl">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-white/40 mb-4">Executive Summary</h2>
                    <p className="text-lg sm:text-xl font-light leading-relaxed text-white/90">
                      {localModel.executive_summary}
                    </p>
                  </motion.div>
                )}

                {/* Contradictions Surface */}
                {localModel?.contradictions?.length > 0 && (
                  <motion.div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/20 bg-amber-500/5">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-amber-500/60 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Contradictions
                    </h2>
                    <div className="flex flex-col gap-4">
                      {localModel.contradictions.map((c: { conflict: string; explanation: string }, i: number) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="text-sm font-medium text-amber-100">{c.conflict}</div>
                          <div className="text-sm text-amber-100/60 font-light">{c.explanation}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Prism Score Widget */}
                  <motion.div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center gap-4 text-center sm:col-span-1">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" 
                          strokeDasharray={`${prismScore * 2.51} 251`} 
                          className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-out" 
                        />
                      </svg>
                      <span className="text-3xl font-light text-white">{prismScore}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/90">Prism Score</div>
                      <div className="text-xs text-white/50">Data usefulness</div>
                    </div>
                  </motion.div>

                  {/* Metrics Widget */}
                  <motion.div className="glass-panel p-6 rounded-3xl sm:col-span-2 grid grid-cols-2 gap-4 content-center">
                    {[
                      { label: "Words", value: analysis.metrics?.wordCount },
                      { label: "Density", value: analysis.metrics?.lexicalDensity },
                      { label: "Sentences", value: analysis.metrics?.sentenceCount },
                      { label: "Avg Length", value: analysis.metrics?.avgWordLength },
                    ].map((metric, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-xs text-white/40 uppercase tracking-wider">{metric.label}</span>
                        <span className="text-2xl font-light text-white">{metric.value}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Sentiment Pulse */}
                {localModel?.emotions?.length > 0 && (
                  <motion.div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
                    <h3 className="text-xs font-medium uppercase tracking-widest text-white/40 flex items-center gap-2">
                      Sentiment Pulse
                    </h3>
                    <div className="flex flex-col gap-3">
                      {localModel.emotions.map((e: { emotion: string; intensity: string; why: string }, i: number) => {
                        const intensity = e.intensity?.toLowerCase() || 'medium';
                        const intensityClass = intensity === 'high' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : intensity === 'medium' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.2)]';
                        return (
                          <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <div className="mt-1 flex-shrink-0 relative flex items-center justify-center">
                              <span className={`w-2.5 h-2.5 rounded-full ${intensityClass}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white/90 capitalize">{e.emotion}</span>
                              <span className="text-xs text-white/60">{e.why}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Themes & Opportunities */}
                {(localModel?.themes?.length > 0 || localModel?.opportunities?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {localModel.themes?.length > 0 && (
                      <motion.div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-white/40 flex items-center gap-2">
                          Themes
                        </h3>
                        {localModel.themes.map((theme: { title: string; description: string; evidence?: string }, i: number) => (
                          <div key={i} className="flex flex-col gap-2 border-l-2 border-white/20 pl-3 py-1">
                            <span className="text-sm font-medium text-white/90">{theme.title}</span>
                            <span className="text-xs text-white/60">{theme.description}</span>
                            {theme.evidence && (
                              <blockquote className="text-xs italic text-emerald-200/70 border-l border-emerald-500/30 pl-2 mt-1">
                                &quot;{theme.evidence}&quot;
                              </blockquote>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                    
                    {localModel.opportunities?.length > 0 && (
                      <motion.div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-white/40 flex items-center gap-2">
                          Opportunities
                        </h3>
                        {localModel.opportunities.map((opp: { area: string; action: string }, i: number) => (
                          <div key={i} className="flex flex-col gap-1 border-l-2 border-emerald-500/50 pl-3 py-1">
                            <span className="text-sm font-medium text-emerald-100">{opp.area}</span>
                            <span className="text-xs text-white/60">{opp.action}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Tokens Cloud */}
                {analysis.topTokens?.length > 0 && (
                  <motion.div className="glass-panel p-6 rounded-3xl">
                    <h3 className="text-xs font-medium uppercase tracking-widest text-white/40 mb-4">Top Tokens</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.topTokens.map((t: { token: string; count: number }, i: number) => (
                        <div key={i} className="glass-pill px-3 py-1.5 flex items-center gap-2 text-xs">
                          <span className="text-white/80">{t.token}</span>
                          <span className="text-white/30 font-mono">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Raw JSON Fallback / View */}
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors flex items-center gap-2 py-4 select-none">
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    View Raw Telemetry
                  </summary>
                  <pre className="glass-panel p-4 rounded-xl font-mono text-[10px] sm:text-xs leading-relaxed text-white/60 overflow-x-auto mt-2">
                    {JSON.stringify(analysis, null, 2)}
                  </pre>
                </details>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      </div>
    </>
  );
}
