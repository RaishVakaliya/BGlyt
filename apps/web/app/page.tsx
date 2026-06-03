"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  Trash2,
  Download,
  Info,
  RefreshCw,
  FileText,
  Maximize2,
  Database,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  Plus,
  Scissors,
} from "lucide-react";

interface PickedImage {
  uri: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  mimeType: string;
}

interface BackgroundRemovalResult {
  resultUri: string;
  durationMs: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const workerCode = `
  self.onmessage = async (e) => {
    const { url, blob, fileName } = e.data;
    try {
      const formData = new FormData();
      formData.append("file", blob, fileName);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "Failed to remove background.";
        try {
          const errData = await response.json();
          errMsg = errData?.detail || errData?.message || errMsg;
          if (Array.isArray(errMsg)) {
            errMsg = errMsg
              .map((err) => (err.loc ? err.loc.join(".") : "field") + ": " + err.msg)
              .join(", ");
          }
        } catch (_) {}
        self.postMessage({ success: false, error: errMsg });
        return;
      }

      const data = await response.json();
      self.postMessage({ success: true, data });
    } catch (err) {
      self.postMessage({ success: false, error: err.message || "Network request failed." });
    }
  };
`;

export default function Home() {
  const [sourceImage, setSourceImage] = useState<PickedImage | null>(null);
  const [result, setResult] = useState<BackgroundRemovalResult | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "done" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0.5);
  const [isPointerDown, setIsPointerDown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const sliderContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    if (node !== null) {
      setContainerWidth(node.getBoundingClientRect().width);

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    }
  }, []);

  const handleReset = useCallback(() => {
    setSourceImage(null);
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setShowMetadata(false);
    setSliderPosition(0.5);
  }, []);

  const processFile = useCallback((file: File) => {
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File Too Large: The selected image is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The maximum supported size is 15 MB.`,
      );
      setStatus("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const uri = e.target?.result as string;

      const img = new window.Image();
      img.onload = () => {
        setSourceImage({
          uri,
          fileName: file.name,
          fileSize: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          mimeType: file.type || "image/jpeg",
        });
        setStatus("idle");
        setErrorMessage(null);
        setResult(null);
      };
      img.onerror = () => {
        setErrorMessage("Invalid Image: Failed to load the image dimensions.");
        setStatus("error");
      };
      img.src = uri;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveBackground = async () => {
    if (!sourceImage) return;

    setStatus("processing");
    setErrorMessage(null);
    const startTime = Date.now();

    try {
      const res = await fetch(sourceImage.uri);
      const blob = await res.blob();

      const workerBlob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(workerBlob);
      const worker = new Worker(workerUrl);

      worker.postMessage({
        url: `${API_BASE_URL}/api/remove-background`,
        blob,
        fileName: sourceImage.fileName,
      });

      worker.onmessage = (e) => {
        const { success, data, error } = e.data;
        if (success) {
          const endTime = Date.now();
          setResult({
            resultUri: data.image,
            durationMs: endTime - startTime,
          });
          setStatus("done");
        } else {
          setErrorMessage(error || "Failed to remove background.");
          setStatus("error");
        }
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.onerror = (err) => {
        console.error("Worker error:", err);
        setErrorMessage("Background thread error occurred.");
        setStatus("error");
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };
    } catch (err: any) {
      console.error("Error setting up background thread:", err);
      setErrorMessage(err?.message || "An unexpected error occurred.");
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const link = document.createElement("a");
      link.href = result.resultUri;
      link.download = `BGlyt_${sourceImage?.fileName.split(".")[0] || "bglyt"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failure:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPointerDown(true);
    updateSliderPosition(e.clientX);
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    updateSliderPosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPointerDown(false);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));
    setSliderPosition(position);
  };

  const processedSize = useMemo(() => {
    if (!result) return 0;
    const base64WithoutPrefix = result.resultUri.includes("base64,")
      ? result.resultUri.split("base64,")[1]
      : result.resultUri;
    const padding = (base64WithoutPrefix.match(/=/g) || []).length;
    return (base64WithoutPrefix.length * 3) / 4 - padding;
  }, [result]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative select-none">
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10 animate-pulse-subtle" />

      <header className="w-full max-w-5xl mx-auto px-6 h-20 flex items-center justify-center z-10">
        <div className="flex items-center h-12">
          <Image
            src="/logo.svg"
            alt="BGlyt Logo"
            width={160}
            height={50}
            className="object-contain"
            priority
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 max-w-5xl mx-auto w-full pb-16 justify-center z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Remove Background <br />
            <span className="text-emerald-500">Instantly</span>
          </h1>
          <p className="text-sm md:text-base font-medium text-slate-500 mt-4 max-w-md mx-auto leading-relaxed">
            Upload your photos to remove backgrounds with pixel-perfect AI
            accuracy. Completely free and incredibly fast.
          </p>
        </div>

        {errorMessage && (
          <div className="w-full max-w-md mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between shadow-sm animate-fade-in">
            <div className="flex items-start">
              <AlertTriangle
                className="text-red-500 mr-3 mt-0.5 shrink-0"
                size={18}
              />
              <p className="text-red-800 text-xs font-semibold leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 ml-4 shrink-0 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="w-full max-w-md">
          <div className="bg-white/80 border-2 border-dashed border-emerald-200 rounded-[32px] p-6 flex flex-col items-center justify-between min-h-[340px] shadow-lg shadow-emerald-500/5 relative overflow-hidden backdrop-blur-md">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {!sourceImage ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileBrowser}
                className={`w-full flex-1 flex flex-col justify-center items-center py-10 cursor-pointer rounded-2xl transition-all ${
                  isDragging
                    ? "bg-emerald-50/50 scale-[0.98]"
                    : "hover:bg-slate-50/30"
                }`}
              >
                <div className="mb-6 animate-float-icon">
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <UploadCloud size={28} className="text-white" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  Select or drag an image file
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  PNG, JPG, WebP up to 15MB
                </p>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col justify-between py-2">
                <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-inner">
                  {result ? (
                    <div
                      ref={sliderContainerRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="w-full h-full relative cursor-ew-resize checkerboard touch-none select-none"
                    >
                      <img
                        src={sourceImage.uri}
                        alt="Original comparison layer"
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />

                      <div
                        style={{ width: `${sliderPosition * 100}%` }}
                        className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white checkerboard pointer-events-none"
                      >
                        <img
                          src={result.resultUri}
                          alt="Processed cutout layer"
                          style={{
                            width: containerWidth || "100%",
                          }}
                          className="h-full object-contain max-w-none pointer-events-none"
                          draggable={false}
                        />
                      </div>

                      <div
                        style={{ left: `${sliderPosition * 100}%` }}
                        className="absolute inset-y-0 -ml-4 w-8 flex items-center justify-center pointer-events-none z-10"
                      >
                        <div className="w-8 h-8 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center">
                          <div className="flex space-x-0.5 text-emerald-600">
                            <ChevronLeft size={12} className="shrink-0" />
                            <ChevronRight size={12} className="shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full relative checkerboard flex items-center justify-center">
                      <img
                        src={sourceImage.uri}
                        alt="Selected source preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {status === "processing" && (
                    <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center z-20 rounded-2xl backdrop-blur-sm">
                      <RefreshCw
                        size={36}
                        className="text-emerald-400 animate-spin"
                      />
                      <span className="text-white text-sm font-bold mt-4 tracking-wide">
                        Removing Background...
                      </span>
                    </div>
                  )}

                  {status !== "processing" && (
                    <button
                      onClick={handleReset}
                      aria-label="Remove image"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/65 flex items-center justify-center hover:bg-slate-950/80 active:scale-90 transition-all z-10 text-white shadow-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div
                  className={`collapsible-wrapper ${showMetadata ? "open" : ""}`}
                >
                  <div className="collapsible-content">
                    <div className="w-full bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 shadow-sm">
                      <h4 className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-3">
                        File Specifications{" "}
                        {result ? "(Processed)" : "(Original)"}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/10">
                          <div className="flex items-center text-slate-500 text-xs font-semibold">
                            <FileText
                              size={13}
                              className="text-emerald-600 mr-2 shrink-0"
                            />
                            Name
                          </div>
                          <span className="text-slate-800 text-xs font-bold truncate max-w-[60%]">
                            {result
                              ? `BGlyt_${sourceImage.fileName}`
                              : sourceImage.fileName}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/10">
                          <div className="flex items-center text-slate-500 text-xs font-semibold">
                            <Maximize2
                              size={13}
                              className="text-emerald-600 mr-2 shrink-0"
                            />
                            Dimensions
                          </div>
                          <span className="text-slate-800 text-xs font-bold">
                            {sourceImage.width} × {sourceImage.height} px
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/10">
                          <div className="flex items-center text-slate-500 text-xs font-semibold">
                            <Database
                              size={13}
                              className="text-emerald-600 mr-2 shrink-0"
                            />
                            Size
                          </div>
                          <span className="text-slate-800 text-xs font-bold">
                            {result
                              ? formatFileSize(processedSize)
                              : formatFileSize(sourceImage.fileSize)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-emerald-100/10">
                          <div className="flex items-center text-slate-500 text-xs font-semibold">
                            <Tag
                              size={13}
                              className="text-emerald-600 mr-2 shrink-0"
                            />
                            Format
                          </div>
                          <span className="text-slate-800 text-xs font-bold uppercase">
                            {result
                              ? "PNG (Transparent)"
                              : sourceImage.mimeType.split("/")[1] || "JPEG"}
                          </span>
                        </div>

                        {result && result.durationMs && (
                          <div className="flex justify-between items-center py-1">
                            <div className="flex items-center text-slate-500 text-xs font-semibold">
                              <Clock
                                size={13}
                                className="text-emerald-600 mr-2 shrink-0"
                              />
                              Processing Time
                            </div>
                            <span className="text-slate-800 text-xs font-bold">
                              {(result.durationMs / 1000).toFixed(2)}s
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {status === "done" && result ? (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-3 w-full">
                      <button
                        onClick={handleDownload}
                        disabled={isSaving}
                        className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10"
                      >
                        <Download size={15} className="mr-2" />
                        Download
                      </button>
                      <button
                        onClick={() => setShowMetadata((prev) => !prev)}
                        aria-label="Toggle File Specifications"
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-[0.95] shrink-0 border ${
                          showMetadata
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                            : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100/50"
                        }`}
                      >
                        <Info size={18} />
                      </button>
                    </div>
                    <button
                      onClick={handleReset}
                      className="w-full py-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98]"
                    >
                      <Plus
                        name="plus"
                        size={16}
                        color="#475569"
                        className="mr-2"
                      />
                      Process Another Image
                    </button>
                  </div>
                ) : (
                  <div className="w-full mt-4 flex items-center gap-3">
                    <button
                      onClick={handleRemoveBackground}
                      disabled={status === "processing"}
                      className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10"
                    >
                      {status === "processing" ? (
                        <RefreshCw size={15} className="animate-spin mr-2" />
                      ) : (
                        <Scissors size={15} className="mr-2" />
                      )}
                      {status === "processing" ? "Removing BG..." : "Remove BG"}
                    </button>
                    <button
                      onClick={() => {
                        if (status === "processing") return;
                        setShowMetadata((prev) => !prev);
                      }}
                      disabled={status === "processing"}
                      aria-label="Toggle File Specifications"
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 border ${
                        status === "processing"
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : "active:scale-[0.95]"
                      } ${
                        showMetadata
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100/50"
                      }`}
                    >
                      <Info size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {!sourceImage && (
            <div className="flex space-x-3 w-full mt-4">
              <button
                onClick={triggerFileBrowser}
                className="flex-1 py-3 px-4 bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-100 text-emerald-700 rounded-2xl font-bold text-xs flex items-center justify-center transition-all active:scale-[0.98]"
              >
                <ImageIcon size={14} className="mr-2 text-emerald-600" />
                Browse Gallery
              </button>

              <button
                onClick={triggerFileBrowser}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center transition-all active:scale-[0.98] shadow-md shadow-slate-950/10"
              >
                <Camera size={14} className="mr-2" />
                Use Camera
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full text-center py-6 text-[10px] md:text-xs text-slate-400 tracking-wide font-medium mt-auto border-t border-slate-100 z-10">
        © {new Date().getFullYear()} BGlyt. High-Fidelity Background Removal
        Engine.
      </footer>
    </div>
  );
}
