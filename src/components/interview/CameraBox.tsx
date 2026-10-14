"use client";

import { useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraBoxProps {
  /** "idle" | "recording" | "analyzing" */
  state: "idle" | "recording" | "analyzing";
  stream?: MediaStream | null;
  cameraOn?: boolean;
  micOn?: boolean;
  /** Name to display in the bottom-right name tag */
  name?: string;
  onEnableCamera?: () => void;
  isCompulsory?: boolean;
}

export default function CameraBox({
  state,
  stream = null,
  cameraOn = true,
  micOn = true,
  name = "You",
  onEnableCamera,
  isCompulsory = true,
}: CameraBoxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream && cameraOn) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("[CameraBox] video play error:", err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, cameraOn]);

  const hasLiveVideo = Boolean(stream && cameraOn);

  return (
    <div className="relative w-full aspect-video rounded-2xl bg-[#0F172A] overflow-hidden flex items-center justify-center border border-slate-800 shadow-xl">
      {/* Background dark slate */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      {/* Live Video Feed Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
          hasLiveVideo ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Camera Off / Compulsory Anti-Cheat Alert Overlay */}
      {!hasLiveVideo && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse">
            <ShieldAlert className="size-6 text-rose-500" />
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
              <VideoOff className="size-4 text-rose-400" />
              Candidate Camera is Compulsory
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Video stream must remain actively on throughout the session for automated anti-cheat proctoring and identity verification.
            </p>
          </div>

          {onEnableCamera && (
            <Button
              type="button"
              onClick={onEnableCamera}
              size="sm"
              className="rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2 mt-1 gap-1.5 shadow-lg shadow-rose-600/30"
            >
              <RefreshCw className="size-3.5" /> Enable Webcam Now
            </Button>
          )}
        </div>
      )}

      {/* Silhouette Fallback when cameraOn is simulated without real stream */}
      {hasLiveVideo && !stream && (
        <div className="relative z-10 flex flex-col items-center gap-1 opacity-30">
          <div className="size-16 rounded-full bg-slate-500" />
          <div className="w-24 h-12 rounded-t-full bg-slate-500 mt-1" />
        </div>
      )}

      {/* Recording Ring */}
      {state === "recording" && (
        <div className="absolute inset-0 rounded-2xl border-4 border-[#F43F5E] animate-pulse pointer-events-none z-20" />
      )}

      {/* AI Analyzing Overlay */}
      {state === "analyzing" && (
        <div className="absolute inset-0 rounded-2xl bg-violet-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="size-10 rounded-full ai-gradient flex items-center justify-center animate-pulse">
              <span className="text-white text-lg font-bold">✦</span>
            </div>
            <p className="text-xs text-violet-200 font-semibold tracking-wide">AI Evaluating Response…</p>
          </div>
        </div>
      )}

      {/* Top Left Status Chips */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-20">
        {state === "recording" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F43F5E] text-white shadow-md">
            <span className="size-2 rounded-full bg-white animate-pulse" />
            REC
          </span>
        )}
        {state === "analyzing" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ai-gradient text-white shadow-md">
            <span className="size-2 rounded-full bg-white animate-pulse" />
            AI Analyzing
          </span>
        )}

        {/* Anti-Cheat Proctoring Badge */}
        {hasLiveVideo ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            <ShieldCheck className="size-3 text-emerald-400" />
            Anti-Cheat Proctor Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/90 text-rose-300 border border-rose-500/40 backdrop-blur-sm animate-pulse">
            <ShieldAlert className="size-3 text-rose-400" />
            Video Off • Anti-Cheat Warning
          </span>
        )}
      </div>

      {/* Device indicators — bottom left */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
        <div
          title={hasLiveVideo ? "Camera Active (Compulsory)" : "Camera Inactive (Required)"}
          className={`size-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-colors ${
            hasLiveVideo ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/30 text-rose-400 border border-rose-500/40"
          }`}
        >
          {hasLiveVideo ? <Video className="size-3.5" /> : <VideoOff className="size-3.5" />}
        </div>
        <div
          title={micOn ? "Microphone Ready" : "Microphone Muted"}
          className={`size-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-colors ${
            micOn ? "bg-white/10 text-slate-200 border border-white/10" : "bg-rose-500/30 text-rose-400 border border-rose-500/40"
          }`}
        >
          {micOn ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
        </div>
      </div>

      {/* Name tag — bottom right */}
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-xs tracking-tight text-white font-medium border border-white/10 z-20 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-indigo-400" />
        {name}
      </div>
    </div>
  );
}
