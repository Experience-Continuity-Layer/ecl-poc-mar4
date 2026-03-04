"use client";

import { AnimatePresence, motion } from "motion/react";
import { MeshGradient } from "@paper-design/shaders-react";

export type WallpaperId = "mist" | "twilight" | "aurora";
export type WallpaperTone = "light" | "dark";

export const wallpaperOptions: { id: WallpaperId; label: string; tone: WallpaperTone }[] = [
  { id: "mist", label: "Mist", tone: "light" },
  { id: "twilight", label: "Twilight", tone: "dark" },
  { id: "aurora", label: "Aurora", tone: "light" },
];

export function getWallpaperTone(wallpaper: WallpaperId): WallpaperTone {
  return wallpaperOptions.find((option) => option.id === wallpaper)?.tone ?? "light";
}

function WallpaperLayer({ wallpaper }: { wallpaper: WallpaperId }) {
  if (wallpaper === "mist") {
    return (
      <MeshGradient
        className="absolute inset-0"
        colors={["#d9e9ff", "#8da9ff", "#c9d6ff", "#eef4ff"]}
        distortion={0.52}
        swirl={0.18}
        speed={0.12}
      />
    );
  }

  if (wallpaper === "twilight") {
    return (
      <MeshGradient
        className="absolute inset-0"
        colors={["#0b1431", "#1d2d6d", "#4f4aa8", "#121a3d"]}
        distortion={0.75}
        swirl={0.42}
        speed={0.14}
      />
    );
  }

  return (
    <MeshGradient
      className="absolute inset-0"
      colors={["#ccfff2", "#7fd8ff", "#7aa4ff", "#f3e6ff"]}
      distortion={0.58}
      swirl={0.28}
      speed={0.16}
    />
  );
}

interface WallpaperSwitcherProps {
  activeWallpaper: WallpaperId;
}

export function WallpaperSwitcher({ activeWallpaper }: WallpaperSwitcherProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeWallpaper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <WallpaperLayer wallpaper={activeWallpaper} />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>
    </>
  );
}
