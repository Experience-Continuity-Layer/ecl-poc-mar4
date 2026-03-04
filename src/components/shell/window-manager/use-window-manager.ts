"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppDefinition, ShellAppId, WindowState } from "./types";

const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 220;

const WINDOW_DEFAULTS_STORAGE_KEY = "ecl-os.window-default-sizes.v1";

function clampWindowSize(width: number, height: number) {
  return {
    width: Math.max(MIN_WINDOW_WIDTH, Math.round(width)),
    height: Math.max(MIN_WINDOW_HEIGHT, Math.round(height)),
  };
}

export function useWindowManager(apps: AppDefinition[]) {
  const [, setNextZIndex] = useState(20);

  const [windows, setWindows] = useState<Record<ShellAppId, WindowState>>(() => {
    const entries = apps.map((app, index) => [
      app.id,
      {
        id: app.id,
        isOpen: Boolean(app.startsOpen),
        isMinimized: false,
        hasNotification: false,
        position: app.initialPosition,
        size: app.initialSize,
        zIndex: 10 + index,
      },
    ]);
    return Object.fromEntries(entries) as Record<ShellAppId, WindowState>;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let parsed: unknown;
    try {
      const raw = window.localStorage.getItem(WINDOW_DEFAULTS_STORAGE_KEY);
      if (!raw) return;
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (!parsed || typeof parsed !== "object") return;

    const defaults = parsed as Partial<
      Record<
        ShellAppId,
        {
          width: number;
          height: number;
        }
      >
    >;

    setWindows((previous) => {
      const next = { ...previous };

      for (const app of apps) {
        const stored = defaults[app.id];
        if (!stored) continue;

        const clamped = clampWindowSize(stored.width, stored.height);
        const current = next[app.id];
        if (!current) continue;

        next[app.id] = {
          ...current,
          size: clamped,
        };
      }

      return next;
    });
  }, [apps]);

  const persistWindowDefaults = (nextWindows: Record<ShellAppId, WindowState>) => {
    if (typeof window === "undefined") return;

    const defaults: Partial<
      Record<
        ShellAppId,
        {
          width: number;
          height: number;
        }
      >
    > = {};

    for (const app of apps) {
      const windowState = nextWindows[app.id];
      if (!windowState) continue;
      defaults[app.id] = {
        width: windowState.size.width,
        height: windowState.size.height,
      };
    }

    try {
      window.localStorage.setItem(WINDOW_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // ignore storage errors
    }
  };

  const sortedVisibleWindows = useMemo(
    () =>
      Object.values(windows)
        .filter((windowState) => windowState.isOpen && !windowState.isMinimized)
        .sort((left, right) => left.zIndex - right.zIndex),
    [windows],
  );

  const focusWindow = (id: ShellAppId) => {
    setNextZIndex((previousZ) => {
      const zIndex = previousZ + 1;
      setWindows((previous) => ({
        ...previous,
        [id]: {
          ...previous[id],
          zIndex,
          hasNotification: false,
        },
      }));
      return zIndex;
    });
  };

  const openWindow = (id: ShellAppId) => {
    setNextZIndex((previousZ) => {
      const zIndex = previousZ + 1;
      setWindows((previous) => ({
        ...previous,
        [id]: {
          ...previous[id],
          isOpen: true,
          isMinimized: false,
          hasNotification: false,
          zIndex,
        },
      }));
      return zIndex;
    });
  };

  const notifyWindow = (id: ShellAppId) => {
    setWindows((previous) => {
      const windowState = previous[id];
      if (!windowState || (windowState.isOpen && !windowState.isMinimized)) return previous;
      return {
        ...previous,
        [id]: { ...windowState, hasNotification: true },
      };
    });
  };

  const clearNotification = (id: ShellAppId) => {
    setWindows((previous) => ({
      ...previous,
      [id]: { ...previous[id], hasNotification: false },
    }));
  };

  const closeWindow = (id: ShellAppId) => {
    setWindows((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        isOpen: false,
        isMinimized: false,
      },
    }));
  };

  const minimizeWindow = (id: ShellAppId) => {
    setWindows((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        isMinimized: true,
      },
    }));
  };

  const setWindowPosition = (id: ShellAppId, x: number, y: number) => {
    setWindows((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        position: {
          x: Math.max(0, Math.round(x)),
          y: Math.max(36, Math.round(y)),
        },
      },
    }));
  };

  const setWindowSize = (id: ShellAppId, width: number, height: number) => {
    setWindows((previous) => {
      const clamped = clampWindowSize(width, height);

      const next: Record<ShellAppId, WindowState> = {
        ...previous,
        [id]: {
          ...previous[id],
          size: clamped,
        },
      };

      persistWindowDefaults(next);

      return next;
    });
  };

  return {
    windows,
    sortedVisibleWindows,
    openWindow,
    closeWindow,
    minimizeWindow,
    focusWindow,
    setWindowPosition,
    setWindowSize,
    notifyWindow,
    clearNotification,
  };
}
