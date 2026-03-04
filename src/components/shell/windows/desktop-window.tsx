"use client";

import { PointerEvent as ReactPointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Minus, X } from "lucide-react";
import { motion } from "motion/react";
import type { WindowState } from "../window-manager/types";

type InteractionMode = "drag" | "resize" | null;

interface DesktopWindowProps {
  title: string;
  windowState: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  children: ReactNode;
}

export function DesktopWindow({
  title,
  windowState,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onMove,
  onResize,
  children,
}: DesktopWindowProps) {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(null);
  const interactionRef = useRef({
    startX: 0,
    startY: 0,
    startWindowX: 0,
    startWindowY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  useEffect(() => {
    if (!interactionMode) return;

    const onPointerMove = (event: PointerEvent) => {
      const offsetX = event.clientX - interactionRef.current.startX;
      const offsetY = event.clientY - interactionRef.current.startY;

      if (interactionMode === "drag") {
        onMove(
          interactionRef.current.startWindowX + offsetX,
          interactionRef.current.startWindowY + offsetY,
        );
        return;
      }

      onResize(
        interactionRef.current.startWidth + offsetX,
        interactionRef.current.startHeight + offsetY,
      );
    };

    const onPointerUp = () => {
      setInteractionMode(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [interactionMode, onMove, onResize]);

  const startDrag = (event: ReactPointerEvent) => {
    event.preventDefault();
    onFocus();
    interactionRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWindowX: windowState.position.x,
      startWindowY: windowState.position.y,
      startWidth: windowState.size.width,
      startHeight: windowState.size.height,
    };
    setInteractionMode("drag");
  };

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    onFocus();
    interactionRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWindowX: windowState.position.x,
      startWindowY: windowState.position.y,
      startWidth: windowState.size.width,
      startHeight: windowState.size.height,
    };
    setInteractionMode("resize");
  };

  return (
    <motion.article
      className={`absolute overflow-hidden rounded-xl border bg-white/96 shadow-[0_22px_50px_rgba(0,0,0,0.24)] backdrop-blur ${
        isActive ? "border-zinc-300" : "border-zinc-200/80"
      }`}
      initial={{ opacity: 0, scale: 0.985, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 16 }}
      transition={{
        duration: 0.34,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.size.width,
        height: windowState.size.height,
        zIndex: windowState.zIndex,
      }}
      onMouseDown={onFocus}
    >
      <header
        className="grid h-10 cursor-move grid-cols-[auto_1fr_auto] items-center border-b border-zinc-200/80 bg-zinc-100/90 px-3 backdrop-blur-sm"
        onPointerDown={startDrag}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="group/control relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 transition-all duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/80"
            onClick={onClose}
            aria-label={`Close ${title}`}
            title="Close"
          >
            <X className="h-2.5 w-2.5 text-red-900/80 opacity-0 transition-opacity duration-150 group-hover/control:opacity-100 group-focus-visible/control:opacity-100" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="group/control relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 transition-all duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
            onClick={onMinimize}
            aria-label={`Minimize ${title}`}
            title="Minimize"
          >
            <Minus className="h-2.5 w-2.5 text-amber-900/80 opacity-0 transition-opacity duration-150 group-hover/control:opacity-100 group-focus-visible/control:opacity-100" strokeWidth={2.6} />
          </button>
        </div>
        <p className="truncate px-2 text-center text-sm leading-none font-medium text-zinc-700">{title}</p>
        <div />
      </header>
      <div className="h-[calc(100%-40px)] overflow-auto bg-white">{children}</div>
      <button
        type="button"
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-transparent"
        onPointerDown={startResize}
        aria-label={`Resize ${title}`}
      />
    </motion.article>
  );
}
