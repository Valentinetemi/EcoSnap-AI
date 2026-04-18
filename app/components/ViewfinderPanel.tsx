"use client";
import { motion, AnimatePresence } from "framer-motion";
import { RefObject } from "react";
import { HandState } from "../hooks/useMediaPipe";
import { AppPhase } from "../hooks/useEcoStore";

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  captureRef: RefObject<HTMLCanvasElement>;
  handState: HandState;
  phase: AppPhase;
  ready: boolean;
  onFlip: () => void;
}

const categoryColors: Record<string, string> = {
  heating: "#ef4444",
  cooling: "#3b82f6",
  computing: "#8b5cf6",
  kitchen: "#f59e0b",
  lighting: "#fbbf24",
  entertainment: "#ec4899",
  laundry: "#06b6d4",
  other: "#6b7280",
};

export default function ViewfinderPanel({
  videoRef,
  canvasRef,
  captureRef,
  handState,
  phase,
  ready,
  onFlip,
}: Props) {
  const isScanning = phase === "SCANNING" || phase === "ANALYZING";
  const pinchProgress = Math.max(
    0,
    Math.min(1, 1 - handState.distance / 0.055),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Main viewfinder */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/10",
          background: "var(--bg-panel)",
          borderRadius: "8px",
          overflow: "hidden",
          border: handState.pinching
            ? "1px solid rgba(0,229,160,0.8)"
            : isScanning
              ? "1px solid rgba(0,200,240,0.6)"
              : "1px solid var(--border)",
          transition: "border-color 0.2s",
          boxShadow: handState.pinching
            ? "0 0 30px rgba(0,229,160,0.2), inset 0 0 30px rgba(0,229,160,0.05)"
            : "none",
        }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
          muted
          playsInline
          autoPlay
        />
        {/* Hand overlay canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transform: "scaleX(-1)",
          }}
        />
        {/* Hidden capture canvas */}
        <canvas ref={captureRef} style={{ display: "none" }} />

        {/* Corner brackets */}
        {["tl", "tr", "bl", "br"].map((pos) => (
          <div
            key={pos}
            style={{
              position: "absolute",
              width: 20,
              height: 20,
              top: pos.startsWith("t") ? 12 : "auto",
              bottom: pos.startsWith("b") ? 12 : "auto",
              left: pos.endsWith("l") ? 12 : "auto",
              right: pos.endsWith("r") ? 12 : "auto",
              borderTop: pos.startsWith("t")
                ? "2px solid var(--accent)"
                : "none",
              borderBottom: pos.startsWith("b")
                ? "2px solid var(--accent)"
                : "none",
              borderLeft: pos.endsWith("l")
                ? "2px solid var(--accent)"
                : "none",
              borderRight: pos.endsWith("r")
                ? "2px solid var(--accent)"
                : "none",
              opacity: handState.pinching ? 1 : 0.4,
              transition: "opacity 0.2s",
            }}
          />
        ))}

        {/* Scan line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
            animation: "scanline 3s linear infinite",
            opacity: 0.4,
          }}
        />

        {/* Pinch pulse rings */}
        <AnimatePresence>
          {handState.pinching && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "1px solid var(--accent)",
                    marginLeft: -40,
                    marginTop: -40,
                  }}
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 3, opacity: 0 }}
                  exit={{}}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.3,
                    repeat: Infinity,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Scanning overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(2,5,8,0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "2px solid var(--bg-panel)",
                  borderTop: "2px solid var(--accent)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  color: "var(--accent)",
                  animation: "ticker 1s ease-in-out infinite",
                }}
              >
                {phase === "SCANNING"
                  ? "CAPTURING FRAME"
                  : "AUDITING WITH GEMINI"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading badge */}
        {!ready && (
  <div style={{
    position: "absolute", inset: 0,
    background: "rgba(2,5,8,0.92)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 16, zIndex: 10,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: "50%",
      border: "2px solid var(--bg-panel)",
      borderTop: "2px solid var(--accent)",
      animation: "spin 1s linear infinite",
    }} />
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: 12, fontFamily: "var(--mono)",
        color: "var(--accent)", letterSpacing: "0.2em",
        marginBottom: 6,
      }}>
        LOADING AI MODEL
      </div>
      <div style={{
        fontSize: 10, fontFamily: "var(--mono)",
        color: "var(--text-dim)", letterSpacing: "0.1em",
      }}>
        downloading hand tracking model...
      </div>
      <div style={{
        fontSize: 10, fontFamily: "var(--mono)",
        color: "var(--text-dim)", letterSpacing: "0.1em",
        marginTop: 4,
      }}>
        this only happens once
      </div>
    </div>
    </div>
)}
</div>
      {/* HUD bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* Hand status */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: handState.detected
                ? "var(--accent)"
                : "var(--text-dim)",
              boxShadow: handState.detected ? "0 0 8px var(--accent)" : "none",
              transition: "all 0.2s",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--mono)",
              color: handState.detected ? "var(--accent)" : "var(--text-muted)",
              letterSpacing: "0.1em",
            }}
          >
            {handState.detected ? "HAND ON" : "NO HAND"}
          </span>
        </div>

        {/* Pinch distance */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 12px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--mono)",
              color: "var(--text-dim)",
              letterSpacing: "0.1em",
              marginBottom: 4,
            }}
          >
            PINCH
          </div>
          <div
            style={{
              height: 3,
              background: "var(--bg-deep)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pinchProgress * 100}%`,
                height: "100%",
                background: handState.pinching
                  ? "var(--accent)"
                  : `linear-gradient(90deg, var(--accent2), var(--accent))`,
                transition: "width 0.1s",
              }}
            />
          </div>
        </div>

        {/* MP status */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ready ? "#7c3aed" : "var(--text-dim)",
              boxShadow: ready ? "0 0 8px #7c3aed" : "none",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--mono)",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
            }}
          >
            {ready ? "MP READY" : "MP LOAD"}
          </span>
        </div>

        {/* Flip button */}
        <button
          onClick={onFlip}
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 10,
            fontFamily: "var(--mono)",
            letterSpacing: "0.1em",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          ⟳ FLIP
        </button>
      </div>

      {/* Instruction */}
      {phase === "IDLE" && (
        <p
          style={{
            fontSize: 11,
            fontFamily: "var(--mono)",
            color: "var(--text-dim)",
            letterSpacing: "0.15em",
            textAlign: "center",
            animation: "ticker 3s ease-in-out infinite",
          }}
        >
          AIM AT AN APPLIANCE · PINCH THUMB + INDEX TO SCAN
        </p>
      )}
    </div>
  );
}
