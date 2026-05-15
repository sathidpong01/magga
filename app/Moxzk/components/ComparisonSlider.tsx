"use client";

import { useEffect, useRef } from "react";

export default function ComparisonSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeLayerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const rectRef = useRef<DOMRect | null>(null);
  const frameRef = useRef<number | null>(null);
  const ratioRef = useRef(0.5);

  const writePosition = (clientX: number) => {
    const rect = rectRef.current ?? containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    ratioRef.current = rect.width > 0 ? x / rect.width : 0.5;
    writePositionFromX(x, rect.width);
  };

  const writePositionFromX = (x: number, width: number) => {
    const rightInset = width - x;

    if (beforeLayerRef.current) {
      beforeLayerRef.current.style.clipPath = `inset(0 ${rightInset}px 0 0)`;
    }

    if (dividerRef.current) {
      dividerRef.current.style.left = `${x}px`;
    }
  };

  const schedulePosition = (clientX: number) => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      writePosition(clientX);
      frameRef.current = null;
    });
  };

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    rectRef.current = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    schedulePosition(event.clientX);
  };

  const updateDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    schedulePosition(event.clientX);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    rectRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    const refreshFromRatio = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      writePositionFromX(rect.width * ratioRef.current, rect.width);
    };

    refreshFromRatio();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && containerRef.current
        ? new ResizeObserver(refreshFromRatio)
        : null;

    if (containerRef.current) {
      resizeObserver?.observe(containerRef.current);
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-moxzk-comparison-slider
      aria-label="Compare English and Thai manga output"
      className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-2xl cursor-ew-resize select-none"
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 60px rgba(20,184,166,0.08)",
        touchAction: "pan-y",
      }}
      onPointerDown={beginDrag}
      onPointerMove={updateDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={() => {
        draggingRef.current = false;
        rectRef.current = null;
      }}
    >
      {/* Thai */}
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/moxzk-manga-th.png" alt="Thai translation output" className="w-full h-auto block" draggable={false} />
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: "linear-gradient(135deg,#14b8a6,#0ea5e9)" }}>
          ภาษาไทย
        </div>
      </div>

      {/* English */}
      <div
        ref={beforeLayerRef}
        data-moxzk-comparison-before
        className="absolute inset-0 overflow-hidden will-change-[clip-path]"
        style={{ clipPath: "inset(0 50% 0 0)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/moxzk-manga-en.png" alt="English translation output" className="w-full h-auto block" draggable={false} />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: "rgba(30,30,40,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}>
          English
        </div>
      </div>

      {/* Divider */}
      <div
        ref={dividerRef}
        data-moxzk-comparison-divider
        className="absolute top-0 bottom-0 w-0.5 z-30 pointer-events-none"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 8px rgba(255,255,255,0.4)",
          willChange: "left",
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "white", boxShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 3L1 8l4 5M11 3l4 5-4 5" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
