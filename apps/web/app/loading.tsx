"use client";

import { RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 relative select-none">
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-200/10 rounded-full blur-3xl -z-10 animate-pulse-subtle" />

      <div className="w-full max-w-sm bg-white/80 border-2 border-dashed border-emerald-200 rounded-[32px] p-8 flex flex-col items-center text-center shadow-lg shadow-emerald-500/5 backdrop-blur-md">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
          <RefreshCw size={28} className="text-white animate-spin" />
        </div>
        
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          Loading BGlyt...
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
          Please wait a moment while we load the workspace components.
        </p>
      </div>
    </div>
  );
}
