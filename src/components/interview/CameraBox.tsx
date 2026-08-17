"use client";

import { Video, VideoOff, Mic, MicOff } from "lucide-react";

interface CameraBoxProps {
  /** "idle" | "recording" | "analyzing" */
  state: "idle" | "recording" | "analyzing";
  cameraOn?: boolean;
  micOn?: boolean;
}

export default function CameraBox({ state, cameraOn = true, micOn = true }: CameraBoxProps) {
  return (
    <div className="relative w-full aspect-video rounded-2xl bg-[#0F172A] overflow-hidden flex items-center justify-center">

      {/* Simulated camera feed gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Camera off overlay */}
      {!cameraOn && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-2">
          <VideoOff className="size-8 text-slate-600" />
          <p className="text-xs text-slate-500">Camera is off</p>
        </div>
      )}

      {/* Camera on: silhouette placeholder */}
      {cameraOn && (
        <>
          {/* Silhouette */}
          <div className="relative z-10 flex flex-col items-center gap-1 opacity-30">
            <div className="size-16 rounded-full bg-slate-500" />
            <div className="w-24 h-12 rounded-t-full bg-slate-500 mt-1" />
          </div>

          {/* Recording ring */}
          {state === "recording" && (
            <div className="absolute inset-0 rounded-2xl border-2 border-[#F43F5E] animate-pulse pointer-events-none" />
          )}

          {/* AI analyzing overlay */}
          {state === "analyzing" && (
            <div className="absolute inset-0 rounded-2xl bg-violet-900/30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="size-10 rounded-full ai-gradient flex items-center justify-center animate-pulse">
                  <span className="text-white text-lg">✦</span>
                </div>
                <p className="text-xs text-violet-200 font-medium">AI is analyzing…</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Status chips — top left */}
      <div className="absolute top-3 left-3 flex gap-2">
        {state === "recording" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs tracking-tight font-semibold bg-[#F43F5E] text-white">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            REC
          </span>
        )}
        {state === "analyzing" && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs tracking-tight font-semibold ai-gradient text-white">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            AI Analyzing
          </span>
        )}
      </div>

      {/* Device indicators — bottom left */}
      <div className="absolute bottom-3 left-3 flex gap-1.5">
        <div className={`size-6 rounded-lg flex items-center justify-center ${cameraOn ? "bg-white/10" : "bg-[#F43F5E]/80"}`}>
          {cameraOn ? <Video className="size-3 text-white" /> : <VideoOff className="size-3 text-white" />}
        </div>
        <div className={`size-6 rounded-lg flex items-center justify-center ${micOn ? "bg-white/10" : "bg-[#F43F5E]/80"}`}>
          {micOn ? <Mic className="size-3 text-white" /> : <MicOff className="size-3 text-white" />}
        </div>
      </div>

      {/* Name tag — bottom right */}
      <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-xs tracking-tight text-white font-medium">
        Ananya Krishnan
      </div>
    </div>
  );
}
