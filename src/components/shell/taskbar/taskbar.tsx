"use client";

import { motion } from "motion/react";
import type { AppDefinition, ShellAppId, WindowState } from "../window-manager/types";
import type { WallpaperTone } from "../wallpaper-switcher";

interface TaskbarProps {
  apps: AppDefinition[];
  windows: Record<ShellAppId, WindowState>;
  onLaunch: (id: ShellAppId) => void;
  wallpaperTone: WallpaperTone;
}

export function Taskbar({ apps, windows, onLaunch, wallpaperTone }: TaskbarProps) {
  const dockSpring = { type: "spring", stiffness: 180, damping: 20, mass: 0.8 } as const;
  const darkWallpaper = wallpaperTone === "dark";

  return (
    <footer className="pointer-events-none absolute bottom-3 left-0 right-0 z-[200] flex justify-center px-3">
      <div className="pointer-events-auto flex max-w-[90vw] items-end gap-2.5 overflow-visible px-1 pb-1">
        {apps.map((app) => {
          const state = windows[app.id];
          const AppIcon = app.icon;
          const isRunning = state.isOpen;
          const isMinimized = state.isMinimized;
          const isActive = isRunning && !isMinimized;
          return (
            <motion.button
              key={app.id}
              type="button"
              onClick={() => onLaunch(app.id)}
              initial="rest"
              animate="rest"
              whileHover="hover"
              className="relative flex shrink-0 flex-col items-center gap-1"
              aria-label={`Open ${app.title}`}
            >
              <motion.span
                variants={{
                  rest: { y: 0, scale: 1 },
                  hover: { y: -2, scale: 1.03 },
                }}
                transition={dockSpring}
                className={`relative flex h-12 w-12 origin-bottom items-center justify-center overflow-hidden rounded-[16px] border shadow-[0_4px_10px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.05)] transition-[background-color,border-color,color,box-shadow] duration-300 ${
                  isActive
                    ? darkWallpaper
                      ? "border-white/60 bg-white/78 text-zinc-900"
                      : "border-white/60 bg-white/38 text-zinc-900"
                    : darkWallpaper
                      ? "border-white/35 bg-zinc-900/52 text-zinc-100 hover:bg-zinc-900/66"
                      : "border-white/42 bg-white/24 text-zinc-700 hover:bg-white/30"
                }`}
                aria-hidden
              >
                <span
                  className={`pointer-events-none absolute inset-px rounded-[15px] bg-gradient-to-b ${
                    darkWallpaper ? "from-white/20 via-white/8 to-transparent" : "from-white/54 via-white/16 to-white/6"
                  }`}
                  aria-hidden
                />
                <span
                  className={`pointer-events-none absolute -left-2 -top-2 h-7 w-9 rounded-full blur-[2px] ${
                    darkWallpaper ? "bg-white/16" : "bg-white/30"
                  }`}
                  aria-hidden
                />
                <span
                  className={`pointer-events-none absolute inset-0 rounded-[16px] ${
                    darkWallpaper
                      ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-0.5px_0_rgba(0,0,0,0.5)]"
                      : "shadow-[inset_0_1px_0_rgba(255,255,255,0.62),inset_0_-0.5px_0_rgba(71,85,105,0.24)]"
                  }`}
                  aria-hidden
                />
                <AppIcon className="relative z-10 h-5 w-5" strokeWidth={1.85} />
              </motion.span>

              <motion.span
                variants={{
                  rest: { opacity: 0, y: 2 },
                  hover: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] shadow-lg ${
                  darkWallpaper ? "bg-white/95 text-zinc-900" : "bg-zinc-900/95 text-white"
                }`}
              >
                {app.title}
              </motion.span>

              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  isRunning
                    ? isMinimized
                      ? darkWallpaper
                        ? "bg-zinc-300"
                        : "bg-zinc-400"
                      : darkWallpaper
                        ? "bg-white"
                        : "bg-zinc-900"
                    : "bg-transparent"
                }`}
                aria-hidden
              />
            </motion.button>
          );
        })}
      </div>
    </footer>
  );
}
