"use client";

import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 relative select-none">
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-200/10 rounded-full blur-3xl -z-10 animate-pulse-subtle" />

      <div className="w-full max-w-md bg-white/80 border-2 border-dashed border-emerald-200 rounded-[32px] p-8 flex flex-col items-center text-center shadow-lg shadow-emerald-500/5 backdrop-blur-md">
        <div className="mb-6 animate-float-icon">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <AlertCircle size={28} className="text-white" />
          </div>
        </div>

        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight">
          404
        </h1>
        <h2 className="text-lg font-bold text-slate-800 mt-2">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-400 mt-3 max-w-xs leading-relaxed">
          The page you are looking for does not exist or has been moved. Use the button below to return to the main dashboard.
        </p>

        <Link
          href="/"
          className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10"
        >
          <Home size={15} className="mr-2" />
          Go back to Home
        </Link>
      </div>
    </div>
  );
}
