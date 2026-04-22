/**
 * Shared type definitions for the Universal Markdown Studio.
 */

export type ThemeMode = "dark" | "light";

export interface SecurityFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "secret" | "injection" | "grc";
  title: string;
  detail: string;
  line?: number;
  snippet?: string;
}

export interface WidgetConfig {
  id: string;
  kind:
    | "github-stats"
    | "streak-stats"
    | "top-langs"
    | "wakatime"
    | "activity-graph"
    | "trophies";
  username: string;
  theme: string; // "tokyonight" | "radical" | "dracula" | "custom"
  hexPrimary?: string;
  hexBg?: string;
  showIcons?: boolean;
  hideBorder?: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  content: string;
  label?: string;
}
