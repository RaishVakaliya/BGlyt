"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 relative select-none">
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-200/10 rounded-full blur-3xl -z-10 animate-pulse-subtle" />

      <div className="w-full max-w-md bg-white/80 border-2 border-dashed border-red-200 rounded-[32px] p-8 flex flex-col items-center text-center shadow-lg shadow-red-500/5 backdrop-blur-md">
        <div className="mb-6 animate-float-icon">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
            <AlertTriangle size={28} className="text-white" />
          </div>
        </div>

        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          Something went wrong!
        </h1>
        <p className="text-xs text-red-600 bg-red-50/50 border border-red-100 rounded-2xl p-4 mt-3 max-w-xs leading-relaxed break-words font-mono text-left w-full">
          {error.message || "An unexpected application error occurred."}
        </p>

        <button
          onClick={reset}
          className="mt-8 w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98] shadow-md shadow-red-500/10"
        >
          <RefreshCw size={15} className="mr-2" />
          Try Again
        </button>
      </div>
    </div>
  );
}
