"use client";

import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Globe,
  Mail,
  MessageCircle,
  Monitor,
  Palette,
  PhoneCall,
  Puzzle,
  SlidersHorizontal,
  SwatchBook,
  UserRound,
} from "lucide-react";
import { Taskbar } from "./taskbar/taskbar";
import { useWindowManager } from "./window-manager/use-window-manager";
import type { AppDefinition, ShellAppId } from "./window-manager/types";
import { AgentControlCenterWindow } from "./windows/agent-control-center-window";
import { ContextInspectorWindow } from "./windows/context-inspector-overlay";
import { CustomerProfileSimulatorWindow } from "./windows/customer-profile-simulator-window";
import { DataIntegrationsPanelWindow } from "./windows/data-integrations-panel-window";
import { DesktopWindow } from "./windows/desktop-window";
import { PlaceholderWindowContent } from "./windows/placeholder-window-content";
import { ToolDesignSystemWindow } from "./windows/tool-design-system-window";
import { WebBrowserWindow } from "./windows/web-browser-window";
import { WhatsAppWindow } from "./windows/whatsapp-window";
import {
  getWallpaperTone,
  wallpaperOptions,
  WallpaperSwitcher,
  type WallpaperId,
} from "./wallpaper-switcher";

const appDefinitions: AppDefinition[] = [
  {
    id: "web-browser",
    title: "Web Browser",
    icon: Globe,
    description: "Fake e-commerce browser surface for continuity demos.",
    initialPosition: { x: 40, y: 44 },
    initialSize: { width: 640, height: 520 },
  },
  {
    id: "ivr-phone",
    title: "IVR Phone",
    icon: PhoneCall,
    description: "Simulated IVR session with keypad and transfer flows.",
    initialPosition: { x: 120, y: 90 },
    initialSize: { width: 420, height: 520 },
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    icon: MessageCircle,
    description: "Messaging channel mock with continuity handoff view.",
    initialPosition: { x: 160, y: 50 },
    initialSize: { width: 460, height: 700 },
  },
  {
    id: "kiosk",
    title: "Kiosk",
    icon: Monitor,
    description: "Store kiosk interaction panel and journey continuity state.",
    initialPosition: { x: 220, y: 60 },
    initialSize: { width: 640, height: 520 },
  },
  {
    id: "email-client",
    title: "Email Client",
    icon: Mail,
    description: "Mock inbox and thread continuation experience.",
    initialPosition: { x: 260, y: 90 },
    initialSize: { width: 640, height: 500 },
  },
  {
    id: "agent-control-center",
    title: "Agent Control Center",
    icon: SlidersHorizontal,
    description: "Full agent controls, runtime config, and live chat.",
    initialPosition: { x: 60, y: 36 },
    initialSize: { width: 960, height: 640 },
    startsOpen: true,
  },
  {
    id: "context-inspector",
    title: "Context Inspector",
    icon: Brain,
    description: "Readable view into current AgentContext values and recent state.",
    initialPosition: { x: 720, y: 64 },
    initialSize: { width: 460, height: 600 },
  },
  {
    id: "customer-profile-simulator",
    title: "Customer Profile Simulator",
    icon: UserRound,
    description: "Persona presets and profile editing workspace.",
    initialPosition: { x: 190, y: 150 },
    initialSize: { width: 540, height: 500 },
  },
  {
    id: "data-integrations-panel",
    title: "Data & Integrations Panel",
    icon: Puzzle,
    description: "Mock data sources, toggles, and latency controls.",
    initialPosition: { x: 240, y: 140 },
    initialSize: { width: 560, height: 500 },
  },
  {
    id: "tool-design-system",
    title: "Tool Design System",
    icon: SwatchBook,
    description: "Shared components and visual tokens for tool apps.",
    initialPosition: { x: 300, y: 120 },
    initialSize: { width: 720, height: 560 },
  },
];

function renderWindowContent(
  appId: ShellAppId,
  title: string,
  description: string,
  openWindow: (id: ShellAppId) => void,
  notifyWindow?: (id: ShellAppId) => void,
) {
  if (appId === "web-browser") {
    return <WebBrowserWindow onOpenWindow={openWindow} onNotifyWindow={notifyWindow} />;
  }
  if (appId === "agent-control-center") {
    return <AgentControlCenterWindow />;
  }
  if (appId === "context-inspector") {
    return <ContextInspectorWindow />;
  }
  if (appId === "customer-profile-simulator") {
    return <CustomerProfileSimulatorWindow />;
  }
  if (appId === "data-integrations-panel") {
    return <DataIntegrationsPanelWindow />;
  }
  if (appId === "whatsapp") {
    return <WhatsAppWindow />;
  }
  if (appId === "tool-design-system") {
    return <ToolDesignSystemWindow />;
  }
  return <PlaceholderWindowContent title={title} description={description} />;
}

export function VirtualOS() {
  const {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    focusWindow,
    setWindowPosition,
    setWindowSize,
    notifyWindow,
  } = useWindowManager(appDefinitions);
  const [clock, setClock] = useState(() =>
    new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    }).format(new Date()),
  );
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperId>("mist");
  const [isWallpaperMenuOpen, setIsWallpaperMenuOpen] = useState(false);
  const wallpaperMenuRef = useRef<HTMLDivElement | null>(null);
  const wallpaperTone = getWallpaperTone(activeWallpaper);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
        }).format(new Date()),
      );
    const timerId = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!isWallpaperMenuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wallpaperMenuRef.current) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!wallpaperMenuRef.current.contains(target)) {
        setIsWallpaperMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWallpaperMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isWallpaperMenuOpen]);

  const handleLaunch = (id: ShellAppId) => {
    const appWindow = windows[id];
    if (appWindow.isOpen && !appWindow.isMinimized) {
      minimizeWindow(id);
      return;
    }
    openWindow(id);
  };

  const visibleWindows = appDefinitions
    .map((app) => windows[app.id])
    .filter((windowState) => windowState && windowState.isOpen && !windowState.isMinimized);
  const topZIndex = visibleWindows.reduce(
    (highest, windowState) => Math.max(highest, windowState.zIndex),
    0,
  );

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#cfd7e4]">
      <WallpaperSwitcher activeWallpaper={activeWallpaper} />
      <header
        className={`absolute left-0 right-0 top-0 z-[170] flex h-9 items-center justify-between px-3 ${
          wallpaperTone === "dark" ? "text-zinc-200" : "text-zinc-700"
        }`}
      >
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
              wallpaperTone === "dark" ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
            }`}
          >
            E
          </span>
          <span className="font-medium tracking-tight">ECL</span>
          <span className="relative inline-flex items-center group">
            <span
              className={`inline-flex h-5 items-center rounded-md px-2 text-[11px] font-medium ${
                wallpaperTone === "dark" ? "bg-zinc-900/44 text-zinc-100" : "bg-white/45 text-zinc-700"
              }`}
            >
              POC Beta
            </span>
            <span
              className="pointer-events-none absolute left-0 top-full z-[185] mt-1 w-64 rounded-md bg-zinc-900/90 px-3 py-2 text-center text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
            >
              Experimental preview build. Not for broad use or sharing yet.
            </span>
          </span>
        </div>
        <div ref={wallpaperMenuRef} className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsWallpaperMenuOpen((open) => !open)}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
              wallpaperTone === "dark"
                ? "bg-zinc-900/44 text-zinc-100 hover:bg-zinc-900/60"
                : "bg-white/45 text-zinc-700 hover:bg-white/62"
            }`}
            aria-label="Change wallpaper"
            title="Wallpaper"
          >
            <Palette className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <p
            className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${
              wallpaperTone === "dark" ? "bg-zinc-900/44 text-zinc-100" : "bg-white/45 text-zinc-700"
            }`}
          >
            {clock}
          </p>
          {isWallpaperMenuOpen ? (
            <div
              className={`absolute right-0 top-8 z-[185] flex min-w-36 flex-col gap-1 rounded-xl border p-1.5 shadow-xl backdrop-blur-md ${
                wallpaperTone === "dark" ? "border-white/30 bg-zinc-900/70" : "border-white/50 bg-white/70"
              }`}
            >
              {wallpaperOptions.map((wallpaper) => {
                const isActive = wallpaper.id === activeWallpaper;
                return (
                  <button
                    key={wallpaper.id}
                    type="button"
                    onClick={() => {
                      setActiveWallpaper(wallpaper.id);
                      setIsWallpaperMenuOpen(false);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                      isActive
                        ? wallpaperTone === "dark"
                          ? "bg-white/88 text-zinc-900"
                          : "bg-zinc-900 text-white"
                        : wallpaperTone === "dark"
                          ? "text-zinc-100 hover:bg-white/16"
                          : "text-zinc-700 hover:bg-white/65"
                    }`}
                    aria-pressed={isActive}
                  >
                    {wallpaper.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </header>

      <section className="absolute inset-0 pb-20 pt-10">
        {visibleWindows.map((windowState) => {
          const app = appDefinitions.find((entry) => entry.id === windowState.id);
          if (!app) return null;

          return (
            <DesktopWindow
              key={windowState.id}
              title={app.title}
              windowState={windowState}
              isActive={windowState.zIndex === topZIndex}
              onFocus={() => focusWindow(windowState.id)}
              onClose={() => closeWindow(windowState.id)}
              onMinimize={() => minimizeWindow(windowState.id)}
              onMove={(x, y) => setWindowPosition(windowState.id, x, y)}
              onResize={(width, height) => setWindowSize(windowState.id, width, height)}
            >
              {renderWindowContent(app.id, app.title, app.description, openWindow, notifyWindow)}
            </DesktopWindow>
          );
        })}
      </section>

      <Taskbar apps={appDefinitions} windows={windows} onLaunch={handleLaunch} wallpaperTone={wallpaperTone} />
    </main>
  );
}
