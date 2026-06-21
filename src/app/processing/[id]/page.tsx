"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProcessingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "completed" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/report/${id}`);
        if (!res.ok) {
          // Could be 404 while database is initializing
          return;
        }
        const data = await res.json();
        if (data && data.ok && data.analysis) {
          const resObj = data.analysis as any;
          if (resObj.status === "failed") {
            setStatus("error");
            setErrorMsg(resObj.error || "An unknown error occurred.");
          } else if (resObj.status !== "processing") {
            setStatus("completed");
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    const interval = setInterval(pollStatus, 5000);
    pollStatus();

    return () => clearInterval(interval);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          {status === "processing" && (
             <motion.div 
               className="h-full bg-emerald-500" 
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             />
          )}
          {status === "completed" && <div className="h-full bg-emerald-500 w-full" />}
          {status === "error" && <div className="h-full bg-red-500 w-full" />}
        </div>

        <div className="flex flex-col items-center text-center mt-4">
          {status === "processing" && (
            <>
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative">
                 <Clock className="w-8 h-8 text-white/50" />
                 <motion.div 
                    className="absolute inset-0 border-2 border-emerald-500/50 rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                 />
              </div>
              <h2 className="text-2xl font-medium text-white tracking-tight">Comprehensive Analysis Running</h2>
              <p className="text-white/50 mt-3 text-sm leading-relaxed">
                We are processing thousands of rows in the background. This may take a few minutes. You can close this page—we'll email you the report when it's ready.
              </p>
            </>
          )}

          {status === "completed" && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                 <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-medium text-white tracking-tight">Analysis Complete</h2>
              <p className="text-white/50 mt-3 text-sm">Your comprehensive report is ready.</p>
              
              <Link href={`/report/${id}`} className="mt-8 flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-white font-medium border border-white/10">
                View Report <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                 <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-medium text-white tracking-tight">Analysis Failed</h2>
              <p className="text-red-400/80 mt-3 text-sm">{errorMsg}</p>
              
              <Link href="/analyse" className="mt-8 flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-white font-medium border border-white/10">
                Try Again
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
