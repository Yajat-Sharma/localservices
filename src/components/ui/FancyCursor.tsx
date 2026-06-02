"use client";

import { useEffect, useRef, useState } from "react";

export function FancyCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    // Only activate on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let animId: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Snap dot immediately
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }

      if (!isVisible) setIsVisible(true);

      // Detect hoverable elements
      const target = e.target as HTMLElement;
      const hoverable = target.closest(
        "a, button, [role='button'], input, textarea, select, label, [data-cursor='pointer']"
      );
      setIsPointer(!!hoverable);
    };

    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);
    const onDown = () => setIsClicking(true);
    const onUp = () => setIsClicking(false);

    // Smooth ring follows with lerp
    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }

      animId = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    animId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(animId);
    };
  }, [isVisible]);

  // Don't render on touch devices at all
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      {/* Outer glowing ring — lags behind with lerp */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: isPointer ? "52px" : "40px",
          height: isPointer ? "52px" : "40px",
          borderRadius: "50%",
          border: isPointer
            ? "2px solid rgba(236,72,153,0.8)"
            : "1.5px solid rgba(124,58,237,0.6)",
          background: isPointer
            ? "rgba(236,72,153,0.06)"
            : "rgba(124,58,237,0.04)",
          boxShadow: isPointer
            ? "0 0 20px rgba(236,72,153,0.35), inset 0 0 10px rgba(236,72,153,0.1)"
            : "0 0 16px rgba(124,58,237,0.3), inset 0 0 8px rgba(124,58,237,0.08)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 99998,
          opacity: isVisible ? 1 : 0,
          transition:
            "width 0.25s cubic-bezier(0.34,1.56,0.64,1), height 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease",
          willChange: "transform",
          backdropFilter: "blur(1px)",
        }}
      />

      {/* Inner dot — snaps instantly */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: isClicking ? "6px" : isPointer ? "8px" : "6px",
          height: isClicking ? "6px" : isPointer ? "8px" : "6px",
          borderRadius: "50%",
          background: isPointer
            ? "linear-gradient(135deg, #ec4899, #f472b6)"
            : "linear-gradient(135deg, #7c3aed, #a855f7)",
          boxShadow: isPointer
            ? "0 0 12px rgba(236,72,153,0.9), 0 0 4px rgba(236,72,153,1)"
            : "0 0 10px rgba(124,58,237,0.9), 0 0 4px rgba(124,58,237,1)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 99999,
          opacity: isVisible ? 1 : 0,
          transition:
            "width 0.15s ease, height 0.15s ease, opacity 0.3s ease, background 0.25s ease, box-shadow 0.25s ease",
          willChange: "transform",
        }}
      />
    </>
  );
}
