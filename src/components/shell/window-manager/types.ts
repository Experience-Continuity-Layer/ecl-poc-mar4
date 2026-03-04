import type { LucideIcon } from "lucide-react";

export type ShellAppId =
  | "web-browser"
  | "ivr-phone"
  | "whatsapp"
  | "kiosk"
  | "email-client"
  | "agent-control-center"
  | "context-inspector"
  | "customer-profile-simulator"
  | "data-integrations-panel"
  | "tool-design-system";

export interface AppDefinition {
  id: ShellAppId;
  title: string;
  icon: LucideIcon;
  description: string;
  initialPosition: { x: number; y: number };
  initialSize: { width: number; height: number };
  startsOpen?: boolean;
}

export interface WindowState {
  id: ShellAppId;
  isOpen: boolean;
  isMinimized: boolean;
  hasNotification: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}
