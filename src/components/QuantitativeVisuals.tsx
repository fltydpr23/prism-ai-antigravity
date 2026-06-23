import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate } from 'framer-motion';
import { TrendingUp, Activity, Target, Layers, Network, Info } from 'lucide-react';

// --- INTERACTIVE COMPONENTS ---

// 1. 3D Parallax Tilt Card
const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
      className="w-full"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`w-full ${className}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// 2. Data Scrubbing Kaplan-Meier
const ScrubbableKM = ({ points, maxTime, areaD, pathD, dropLines, sorted }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverData, setHoverData] = useState<any>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let xPos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const xPct = (xPos / rect.width) * 100;
    
    let currentVal = 100;
    for (let p of points) {
      const pX = (p.time_milestone / maxTime) * 100;
      if (pX <= xPct) {
        currentVal = p.survival_probability_pct;
      } else {
        break;
      }
    }
    
    setHoverX(xPct);
    setHoverData({ val: currentVal, time: ((xPct / 100) * maxTime).toFixed(1) });
  };

  return (
    <div className="h-[240px] w-full relative z-10 mt-10 pb-8 cursor-crosshair" ref={ref} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverX(null)}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="gradBlueKM" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Premium Grid */}
        {[20, 40, 60, 80].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}
        {[25, 50, 75].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.03)" strokeDasharray="1 2" strokeWidth="0.5" />
        ))}

        <motion.path 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }}
          d={areaD} fill="url(#gradBlueKM)" 
        />
        
        {dropLines.map((l: any, i: number) => (
          <motion.line 
            key={`dl-${i}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 + i * 0.1 }}
            x1={l.x} y1={l.y} x2={l.x} y2="100" 
            stroke="rgba(96,165,250,0.3)" strokeDasharray="1 1.5" strokeWidth="0.5" 
          />
        ))}

        <motion.path 
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          d={pathD} fill="none" stroke="#60a5fa" strokeWidth="1.5" vectorEffect="non-scaling-stroke" filter="url(#glow)"
        />
        
        {sorted.map((p: any, i: number) => {
          const x = (p.time_milestone / maxTime) * 100;
          const y = 100 - p.survival_probability_pct;
          const isLast = i === sorted.length - 1;
          return (
            <g key={i} className="group/marker cursor-pointer">
              {isLast && (
                <motion.circle 
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 2.5, opacity: 0 }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  cx={x} cy={y} r="1.5" fill="none" stroke="#60a5fa" strokeWidth="0.5"
                />
              )}
              <motion.circle 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.2 }}
                cx={x} cy={y} r="1.5" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="0.8" className="shadow-[0_0_10px_#60a5fa]" 
              />
            </g>
          )
        })}
      </svg>
      
      {/* Interactive Scrubber Overlay */}
      {hoverX !== null && hoverData && (
        <div className="absolute top-0 bottom-8 pointer-events-none z-20" style={{ left: `${hoverX}%` }}>
          <div className="w-px h-full bg-blue-400/50 border-l border-dashed border-blue-400/30" />
          <div 
            className="absolute w-3 h-3 bg-blue-500 rounded-full border-[2px] border-white shadow-[0_0_15px_#60a5fa] -ml-1.5"
            style={{ top: `${100 - hoverData.val}%`, transform: 'translateY(-50%)' }} 
          />
          <div 
            className="absolute left-4 bg-black/90 backdrop-blur-md border border-white/20 px-3 py-2 rounded-xl text-white shadow-2xl min-w-[120px]"
            style={{ top: `${100 - hoverData.val}%`, transform: 'translateY(-50%)' }}
          >
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-1">Time: {hoverData.time}</p>
            <p className="text-xl font-mono font-light text-blue-400">{hoverData.val}% <span className="text-sm text-white/60">Survival</span></p>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-3 text-[11px] text-white/40 font-mono uppercase tracking-widest border-t border-white/5 pt-3 pointer-events-none">
        <span>Timeline = 0</span>
        <span>Time Milestones →</span>
        <span>Maximum Limit</span>
      </div>
    </div>
  );
};

// 3. Physics Force Directed Graph (Chi-Square)
const DependencyGraph = ({ dep }: { dep: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x1 = useMotionValue(0);
  const y1 = useMotionValue(0);
  const x2 = useMotionValue(0);
  const y2 = useMotionValue(0);

  const lineX1 = useMotionTemplate`calc(15% + ${x1}px)`;
  const lineY1 = useMotionTemplate`calc(50% + ${y1}px)`;
  const lineX2 = useMotionTemplate`calc(85% + ${x2}px)`;
  const lineY2 = useMotionTemplate`calc(50% + ${y2}px)`;

  return (
    <div ref={ref} className="relative h-40 w-full rounded-2xl bg-black/40 border border-white/5 mb-8 overflow-hidden shadow-inner cursor-crosshair">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
         {dep.is_significant && dep.is_significant !== "Not detected" ? (
           <motion.line 
             x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2}
             stroke="#34d399" strokeWidth="2.5"
             className="drop-shadow-[0_0_12px_rgba(52,211,153,1)]"
           />
         ) : (
           <motion.line 
             x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2}
             stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6"
           />
         )}
      </svg>

      <div className="absolute top-1/2 left-[15%] pointer-events-none">
        <motion.div 
          drag dragConstraints={ref} dragElastic={0.4}
          style={{ x: x1, y: y1 }}
          className="pointer-events-auto cursor-grab active:cursor-grabbing -ml-[4.5rem] -mt-5 flex items-center justify-center bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-white/90 font-medium text-xs shadow-[0_10px_30px_rgba(0,0,0,0.8)] w-[9rem] text-center hover:bg-white/5 transition-colors overflow-hidden"
        >
          <span className="truncate w-full block" title={dep.variables_tested?.[0]}>{dep.variables_tested?.[0]}</span>
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-[85%] pointer-events-none">
        <motion.div 
          drag dragConstraints={ref} dragElastic={0.4}
          style={{ x: x2, y: y2 }}
          className="pointer-events-auto cursor-grab active:cursor-grabbing -ml-[4.5rem] -mt-5 flex items-center justify-center bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-white/90 font-medium text-xs shadow-[0_10px_30px_rgba(0,0,0,0.8)] w-[9rem] text-center hover:bg-white/5 transition-colors overflow-hidden"
        >
          <span className="truncate w-full block" title={dep.variables_tested?.[1]}>{dep.variables_tested?.[1]}</span>
        </motion.div>
      </div>
    </div>
  );
};

// 4. Magnetic Glow Tracking Card (Cluster Profiles)
const MagneticCard = ({ children, className }: any) => {
  const rectRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!rectRef.current) return;
    const rect = rectRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-1000);
    mouseY.set(-1000);
  };

  const background = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(52,211,153,0.12), transparent 60%)`;

  return (
    <motion.div 
      ref={rectRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300" style={{ background }} />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};


// --- MAIN DASHBOARD COMPONENT ---

export default function QuantitativeVisuals({ data }: { data: any }) {
  if (!data) return null;

  const { key_correlations, survival_analysis, pca_components, cluster_profiles, categorical_dependencies } = data;

  return (
    <div className="w-full flex flex-col gap-12 mt-8">
      
      {/* 1. Driver Tornado Chart (3D Tilt) */}
      {key_correlations && key_correlations.length > 0 && (
        <TiltCard>
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.05),transparent_50%)] pointer-events-none" />
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none mix-blend-screen">
              <Target className="w-48 h-48 text-emerald-400" />
            </div>
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white tracking-tight">Key Drivers Analysis</h3>
                <p className="text-sm text-white/50 font-medium mt-1">Coefficient weights determining impact</p>
              </div>
            </div>

            <div className="w-full relative z-10 space-y-6 mt-6">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10 border-l border-white/5 border-dashed z-0" />
              
              {key_correlations.map((entry: any, index: number) => {
                const maxWeight = Math.max(...key_correlations.map((e: any) => Math.abs(e.coefficient_weight || 0)), 10);
                const val = Number(entry.coefficient_weight) || 0;
                const widthPct = Math.min((Math.abs(val) / maxWeight) * 100, 100);
                const isPositive = val >= 0;

                return (
                  <div key={index} className="flex flex-col gap-2 group relative z-10">
                    <div className="flex justify-between text-xs mb-1 px-1">
                      <span className="text-white/80 font-medium tracking-wide">{entry.variable_a} & {entry.variable_b}</span>
                      <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {val > 0 ? '+' : ''}{val.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center h-8 w-full bg-black/50 rounded-lg overflow-hidden relative border border-white/10 shadow-inner">
                      <div className="w-1/2 h-full flex justify-end pr-[2px]">
                        {!isPositive && (
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                            className="h-full bg-gradient-to-l from-rose-500 to-rose-700 rounded-l-md opacity-90 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                          />
                        )}
                      </div>
                      <div className="w-[2px] h-full bg-white/20 relative z-20" />
                      <div className="w-1/2 h-full flex justify-start pl-[2px]">
                        {isPositive && (
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-r-md opacity-90 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1 h-4 overflow-hidden text-ellipsis whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {entry.insight}
                    </p>
                  </div>
                );
              })}
              
              <div className="flex justify-between mt-4 text-[10px] text-white/30 font-mono border-t border-white/10 pt-2">
                <span>Negative Impact</span>
                <span>Neutral (0)</span>
                <span>Positive Impact</span>
              </div>
            </div>
          </motion.div>
        </TiltCard>
      )}

      {/* 2. Survival Analysis Curve (Scrubbable) */}
      {survival_analysis && survival_analysis.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none mix-blend-screen">
            <Activity className="w-48 h-48 text-blue-400" />
          </div>
          
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">Kaplan-Meier Survival Curve</h3>
              <p className="text-sm text-white/50 font-medium mt-1">Interactive event avoidance probability over time</p>
            </div>
          </div>

          {/* Render Scrubbable Component */}
          {(() => {
            const sorted = [...survival_analysis].sort((a, b) => a.time_milestone - b.time_milestone);
            const points = [{ time_milestone: 0, survival_probability_pct: 100 }, ...sorted];
            const maxTime = Math.max(...points.map(p => p.time_milestone), 100);
            
            let pathD = `M 0,${100 - points[0].survival_probability_pct}`;
            let areaD = `M 0,100 L 0,${100 - points[0].survival_probability_pct}`;
            const dropLines = [];

            for (let i = 1; i < points.length; i++) {
              const prev = points[i-1];
              const curr = points[i];
              const x1 = (prev.time_milestone / maxTime) * 100;
              const x2 = (curr.time_milestone / maxTime) * 100;
              const yPrev = 100 - prev.survival_probability_pct;
              const yCurr = 100 - curr.survival_probability_pct;

              pathD += ` L ${x2},${yPrev}`;
              areaD += ` L ${x2},${yPrev}`;
              pathD += ` L ${x2},${yCurr}`;
              areaD += ` L ${x2},${yCurr}`;
              
              dropLines.push({ x: x2, y: yCurr });
            }
            
            const lastX = (points[points.length-1].time_milestone / maxTime) * 100;
            areaD += ` L ${lastX},100 Z`;

            return <ScrubbableKM points={points} maxTime={maxTime} areaD={areaD} pathD={pathD} dropLines={dropLines} sorted={sorted} />;
          })()}
        </motion.div>
      )}

      {/* PCA Components Bubbles */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.05),transparent_50%)] pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none mix-blend-screen">
          <Layers className="w-48 h-48 text-purple-400" />
        </div>
        
        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <Layers className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white tracking-tight">Dimensionality Reduction (PCA)</h3>
            <p className="text-sm text-white/50 font-medium mt-1">Variance explained by hidden principal components</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 items-center justify-center py-10 relative z-10 min-h-[200px]">
          {(!pca_components || pca_components.filter((p: any) => p.variance_explained_pct && !isNaN(Number(p.variance_explained_pct))).length === 0) ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-col items-center justify-center text-center max-w-sm"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-white/30" />
              </div>
              <h4 className="text-white/80 font-medium text-lg mb-2">Insufficient Variance Detected</h4>
              <p className="text-sm text-white/40 leading-relaxed">
                The dataset structure does not contain enough orthogonal variance dimensions to generate statistically significant Principal Components.
              </p>
            </motion.div>
          ) : (
            pca_components.filter((p: any) => p.variance_explained_pct && !isNaN(Number(p.variance_explained_pct))).map((pca: any, i: number) => {
              const size = Math.max(80, (Number(pca.variance_explained_pct) / 100) * 240);
              return (
                <motion.div 
                  key={i}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 + i * 0.15, type: "spring", bounce: 0.4 }}
                  className="rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-600/5 border border-purple-500/40 flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(168,85,247,0.2)] relative group cursor-pointer hover:border-purple-400/60 transition-colors backdrop-blur-md"
                  style={{ width: size, height: size }}
                >
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-300 tracking-tighter drop-shadow-md">
                    {Number(pca.variance_explained_pct)}%
                  </span>
                  <div className="absolute top-full mt-6 left-1/2 -translate-x-1/2 w-56 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 pointer-events-none z-20 shadow-2xl">
                    <p className="text-xs text-purple-300/70 uppercase tracking-widest mb-1.5 font-semibold">{pca.component}</p>
                    <p className="text-sm text-white/90 font-medium leading-snug">Primary Driver:<br/><span className="text-purple-300 text-base">{pca.top_driving_metric}</span></p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* 3. Categorical Dependencies (Chi-Square) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: "spring", stiffness: 100 }}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.05),transparent_50%)] pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none mix-blend-screen">
          <Network className="w-48 h-48 text-amber-400" />
        </div>
        
        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <Network className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white tracking-tight">Categorical Dependencies</h3>
            <p className="text-sm text-white/50 font-medium mt-1">Interactive physics-based correlation nodes</p>
          </div>
        </div>

        <div className="relative z-10">
          {(!categorical_dependencies || categorical_dependencies.filter((d: any) => d.chi_square_statistic != null && d.chi_square_statistic !== "Not detected").length === 0) ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-col items-center justify-center text-center max-w-sm mx-auto py-10"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-white/30" />
              </div>
              <h4 className="text-white/80 font-medium text-lg mb-2">No Significant Dependencies</h4>
              <p className="text-sm text-white/40 leading-relaxed">
                The analysis did not detect any statistically robust categorical dependencies (Chi-Square) in the provided dimensions.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categorical_dependencies.filter((d: any) => d.chi_square_statistic != null && d.chi_square_statistic !== "Not detected").map((dep: any, i: number) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-8 transition-all group shadow-lg flex flex-col justify-between"
                >
                  <DependencyGraph dep={dep} />
                  
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {dep.is_significant ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                            Dependent
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-white/5 text-white/40 border border-white/10 rounded text-[9px] font-bold uppercase tracking-widest">
                            Independent
                          </span>
                        )}
                      </div>
                      <div className="flex gap-6 mt-4">
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1 font-semibold">Chi-Square</p>
                          <p className="text-xl font-mono text-amber-400/90 font-light drop-shadow-sm">
                            {dep.chi_square_statistic != null && !isNaN(Number(dep.chi_square_statistic)) ? Number(dep.chi_square_statistic).toFixed(2) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1 font-semibold">P-Value</p>
                          <p className={`text-xl font-mono font-light drop-shadow-sm ${dep.is_significant ? 'text-emerald-400' : 'text-white/40'}`}>
                            {dep.p_value != null && !isNaN(Number(dep.p_value)) ? Number(dep.p_value).toFixed(4) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/30" />
                    <p className="text-sm text-white/60 leading-relaxed font-medium pl-2">
                      {dep.insight}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. Cluster Profiles Grid (Magnetic Glow) */}
      {cluster_profiles && cluster_profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cluster_profiles.map((cluster: any, idx: number) => (
            <MagneticCard 
              key={idx}
              className="bg-black/20 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-colors shadow-2xl group flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  <h4 className="text-lg font-medium text-white/90 tracking-tight leading-tight">{cluster.cluster_name}</h4>
                </div>
                <div className="px-3 py-1 bg-white/[0.03] rounded-full text-xs font-mono font-medium text-white/40 border border-white/5">
                  {cluster.percentage_of_data}%
                </div>
              </div>
              
              <div className="flex-grow space-y-6">
                {cluster.business_persona ? (
                  <>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-white/30 font-semibold mb-2">Persona Profile</div>
                      <p className="text-[13px] text-white/70 leading-relaxed font-medium">{cluster.business_persona}</p>
                    </div>
                    
                    <div className="pt-6 border-t border-white/[0.03]">
                      <div className="text-[9px] uppercase tracking-widest text-emerald-400/50 font-semibold mb-2">Strategic Play</div>
                      <p className="text-[13px] text-white/50 leading-relaxed italic">{cluster.strategic_implication}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[9px] uppercase tracking-widest text-white/30 font-semibold mb-3">Mathematical Bounds</div>
                    <ul className="space-y-3">
                      {cluster.key_characteristics?.map((trait: string, tIdx: number) => (
                        <li key={tIdx} className="text-xs text-white/40 flex items-start gap-3 leading-relaxed font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/10 mt-1 shrink-0" />
                          {trait}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </MagneticCard>
          ))}
        </div>
      )}
    </div>
  );
}
