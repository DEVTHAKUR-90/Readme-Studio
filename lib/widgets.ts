import type { WidgetConfig } from "@/types";

/**
 * Render a widget configuration to a one-line markdown image reference.
 * Uses the community-standard providers (`github-readme-stats`,
 * `github-readme-streak-stats`, `wakatime-badge`, etc.) because they're
 * what every trending profile README relies on.
 */
export function renderWidgetMarkdown(cfg: WidgetConfig): string {
  const hex = (cfg.hexPrimary ?? "22E4FF").replace(/^#/, "");
  const bg = (cfg.hexBg ?? "0D1117").replace(/^#/, "");
  const theme = cfg.theme || "tokyonight";
  const u = encodeURIComponent(cfg.username || "octocat");
  const showIcons = cfg.showIcons ? "&show_icons=true" : "";
  const hideBorder = cfg.hideBorder ? "&hide_border=true" : "";

  switch (cfg.kind) {
    case "github-stats":
      return `![GitHub Stats](https://github-readme-stats.vercel.app/api?username=${u}&theme=${theme}&title_color=${hex}&icon_color=${hex}&bg_color=${bg}${showIcons}${hideBorder})`;
    case "streak-stats":
      return `![GitHub Streak](https://streak-stats.demolab.com?user=${u}&theme=${theme}&ring=${hex}&fire=${hex}&currStreakLabel=${hex}${hideBorder})`;
    case "top-langs":
      return `![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&theme=${theme}&title_color=${hex}&bg_color=${bg}${hideBorder})`;
    case "wakatime":
      return `![WakaTime](https://github-readme-stats.vercel.app/api/wakatime?username=${u}&theme=${theme}&title_color=${hex}&bg_color=${bg}${hideBorder})`;
    case "activity-graph":
      return `![Activity Graph](https://github-readme-activity-graph.vercel.app/graph?username=${u}&theme=${theme}&bg_color=${bg}&color=${hex}&line=${hex}&point=${hex})`;
    case "trophies":
      return `![Trophies](https://github-profile-trophy.vercel.app/?username=${u}&theme=${theme}&no-frame=${cfg.hideBorder ? "true" : "false"}&column=6)`;
  }
}
