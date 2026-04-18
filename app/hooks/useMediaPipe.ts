"use client";
import { useRef, useEffect, useState, useCallback } from "react";

const PINCH_THRESHOLD = 0.055;
const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export interface HandState {
  detected: boolean;
  pinching: boolean;
  distance: number;
  landmarks: Array<{ x: number; y: number; z: number }>;
}

interface UseMediaPipeOptions {
  onPinch: (captureFrame: () => string | null) => void;
}

export function useMediaPipe({ onPinch }: UseMediaPipeOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(-1);
  const cooldownRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const [ready, setReady] = useState(false);
  const [handState, setHandState] = useState<HandState>({
    detected: false, pinching: false, distance: 1, landmarks: [],
  });
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = captureRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0);
    ctx.restore();
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  }, []);

  // Draw hand skeleton on canvas
  const drawHand = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    W: number, H: number,
    pinching: boolean
  ) => {
    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    // Draw connections
    ctx.lineWidth = 1.5;
    CONNECTIONS.forEach(([a, b]) => {
      const lmA = landmarks[a], lmB = landmarks[b];
      const grad = ctx.createLinearGradient(lmA.x * W, lmA.y * H, lmB.x * W, lmB.y * H);
      grad.addColorStop(0, pinching ? "rgba(0,229,160,0.9)" : "rgba(0,200,150,0.5)");
      grad.addColorStop(1, pinching ? "rgba(0,200,240,0.9)" : "rgba(0,160,200,0.5)");
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(lmA.x * W, lmA.y * H);
      ctx.lineTo(lmB.x * W, lmB.y * H);
      ctx.stroke();
    });

    // Draw joints
    landmarks.forEach((lm, i) => {
      const isKey = [4, 8].includes(i);
      const isPinchPoint = isKey && pinching;
      const r = isPinchPoint ? 7 : isKey ? 5 : 3;
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, r, 0, Math.PI * 2);
      ctx.fillStyle = isPinchPoint ? "#00e5a0" : isKey ? "#00c8f0" : "rgba(0,200,150,0.6)";
      ctx.fill();
      if (isPinchPoint) {
        ctx.beginPath();
        ctx.arc(lm.x * W, lm.y * H, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,229,160,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw pinch line
    if (landmarks[4] && landmarks[8]) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(landmarks[4].x * W, landmarks[4].y * H);
      ctx.lineTo(landmarks[8].x * W, landmarks[8].y * H);
      ctx.strokeStyle = pinching ? "rgba(0,229,160,0.8)" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, []);

  // Detection loop
  useEffect(() => {
    if (!ready) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const loop = () => {
      if (video.currentTime !== lastTimeRef.current && !video.paused) {
        lastTimeRef.current = video.currentTime;
        const W = video.videoWidth || 640;
        const H = video.videoHeight || 480;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }
        ctx.clearRect(0, 0, W, H);

        try {
          const lm = landmarkerRef.current as { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks?: Array<Array<{x:number,y:number,z:number}>> } };
          const res = lm.detectForVideo(video, performance.now());
          if (res?.landmarks?.length) {
            const points = res.landmarks[0];
            const dx = points[4].x - points[8].x;
            const dy = points[4].y - points[8].y;
            const dz = points[4].z - points[8].z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const pinching = dist < PINCH_THRESHOLD;

            setHandState({ detected: true, pinching, distance: dist, landmarks: points });
            drawHand(ctx, points, W, H, pinching);

            if (pinching && !cooldownRef.current) {
              cooldownRef.current = true;
              onPinch(captureFrame);
              setTimeout(() => { cooldownRef.current = false; }, 2500);
            }
          } else {
            setHandState({ detected: false, pinching: false, distance: 1, landmarks: [] });
          }
        } catch (_) {}
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, onPinch, drawHand, captureFrame]);

  // Load MediaPipe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const resolver = await vision.FilesetResolver.forVisionTasks(WASM_PATH);
        const hl = await vision.HandLandmarker.createFromOptions(resolver, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (!cancelled) { landmarkerRef.current = hl; setReady(true); }
      } catch (e) { console.error("MediaPipe load failed", e); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Start camera
  const startCamera = useCallback(async (mode: "user" | "environment") => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
    } catch (e) { console.error("Camera error", e); }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const flipCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  return { videoRef, canvasRef, captureRef, ready, handState, flipCamera, facingMode };
}