import type { SecurityFinding } from "@/types";
import { uid } from "./utils";

/**
 * Curated set of secret detectors. Each rule has a name and a RegExp. Patterns
 * are tuned to minimize false positives inside prose documentation. These run
 * line-by-line so we can surface exact line numbers in the UI.
 */
const SECRET_RULES: Array<{
  id: string;
  title: string;
  severity: SecurityFinding["severity"];
  rx: RegExp;
}> = [
  {
    id: "aws-access-key",
    title: "AWS Access Key ID",
    severity: "critical",
    rx: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: "aws-secret",
    title: "AWS Secret Access Key",
    severity: "critical",
    // AWS secrets are exactly 40 chars of base64url. To avoid false-positives
    // on SHA hashes, Shields.io URLs, and asset manifests, we require the
    // string to appear on a line that also contains a credential-signaling
    // keyword (aws_secret, secret_access_key, etc.). A plain 40-char base64
    // alone is flagged by the entropy heuristic at lower severity.
    rx: /(?:aws[_-]?secret[_-]?access[_-]?key|secret[_-]?access[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})\b/gi,
  },
  {
    id: "gh-pat",
    title: "GitHub Personal Access Token",
    severity: "critical",
    rx: /\bghp_[A-Za-z0-9]{36,}\b/g,
  },
  {
    id: "gh-oauth",
    title: "GitHub OAuth token",
    severity: "critical",
    rx: /\bgho_[A-Za-z0-9]{36,}\b/g,
  },
  {
    id: "gh-fine-grained",
    title: "GitHub fine-grained PAT",
    severity: "critical",
    rx: /\bgithub_pat_[A-Za-z0-9_]{70,}\b/g,
  },
  {
    id: "slack-token",
    title: "Slack token",
    severity: "high",
    rx: /\bxox[abpr]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    id: "stripe-live",
    title: "Stripe live secret key",
    severity: "critical",
    rx: /\bsk_live_[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: "stripe-test",
    title: "Stripe test secret key",
    severity: "medium",
    rx: /\bsk_test_[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: "google-api",
    title: "Google API key",
    severity: "high",
    rx: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: "openai",
    title: "OpenAI API key",
    severity: "critical",
    rx: /\bsk-[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: "anthropic",
    title: "Anthropic API key",
    severity: "critical",
    rx: /\bsk-ant-[A-Za-z0-9_-]{80,}\b/g,
  },
  {
    id: "jwt",
    title: "JSON Web Token",
    severity: "high",
    rx: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    id: "private-key",
    title: "Private key block",
    severity: "critical",
    rx: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PGP|ENCRYPTED)?\s*PRIVATE KEY-----/g,
  },
  {
    id: "generic-password",
    title: "Hard-coded password assignment",
    severity: "medium",
    rx: /\b(?:password|passwd|pwd)\s*[:=]\s*['"][^'"\s]{4,}['"]/gi,
  },
];

/**
 * Very small set of injection heuristics. These are intentionally conservative;
 * we'd rather miss an issue than scream on every harmless `<script>` example.
 */
const INJECTION_RULES: Array<{
  id: string;
  title: string;
  severity: SecurityFinding["severity"];
  rx: RegExp;
}> = [
  {
    id: "script-tag",
    title: "Raw <script> tag",
    severity: "high",
    rx: /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
  },
  {
    id: "iframe-tag",
    title: "Raw <iframe> tag",
    severity: "medium",
    rx: /<iframe\b[^>]*>/gi,
  },
  {
    id: "js-proto-url",
    title: "javascript: URL",
    severity: "high",
    rx: /href\s*=\s*['"]\s*javascript:/gi,
  },
  {
    id: "on-event",
    title: "Inline event handler (onClick/onLoad/…)",
    severity: "medium",
    rx: /\son[a-z]+\s*=\s*['"][^'"]+['"]/gi,
  },
];

const GRC_CHECKS: Array<{
  id: string;
  title: string;
  matcher: RegExp;
  detail: string;
}> = [
  {
    id: "grc-license",
    title: "LICENSE section",
    matcher: /^##?#?\s*(license|licensing)\b/im,
    detail:
      "Open source compliance: add a License section so consumers know usage terms.",
  },
  {
    id: "grc-contributing",
    title: "CONTRIBUTING section",
    matcher: /^##?#?\s*(contribut(?:ing|ions?))\b/im,
    detail:
      "Project hygiene: include a Contributing section or link to CONTRIBUTING.md.",
  },
  {
    id: "grc-coc",
    title: "Code of Conduct",
    matcher: /code[\s_-]?of[\s_-]?conduct/i,
    detail:
      "Inclusion: link to a Code of Conduct (recommended by CNCF / OpenSSF).",
  },
  {
    id: "grc-security",
    title: "Security policy",
    matcher: /^##?#?\s*security\b|SECURITY\.md/im,
    detail:
      "Disclosure: include a Security section or SECURITY.md so vuln reports have a home.",
  },
];

/** Build a short contextual snippet around a match. */
function snippet(line: string, matchIndex: number, matchLen: number): string {
  const start = Math.max(0, matchIndex - 12);
  const end = Math.min(line.length, matchIndex + matchLen + 12);
  const s = line.slice(start, end).replace(/\s+/g, " ");
  const prefix = start > 0 ? "…" : "";
  const suffix = end < line.length ? "…" : "";
  return `${prefix}${s}${suffix}`;
}

/**
 * Shannon entropy heuristic – flags strings that look random enough to be
 * secrets even if no specific rule matches.
 */
function shannonEntropy(s: string): number {
  if (!s) return 0;
  const freq = new Map<string, number>();
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let H = 0;
  for (const count of freq.values()) {
    const p = count / s.length;
    H -= p * Math.log2(p);
  }
  return H;
}

/**
 * Scan markdown for secrets, injection vectors and GRC compliance gaps.
 * Returns a stable, ordered list of findings suitable for rendering.
 */
export function scanMarkdown(text: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = text.split("\n");

  // Pre-compute which lines are inside fenced code blocks so we can skip the
  // entropy heuristic there (code blocks are full of hashes, base64 blobs,
  // package-lock integrity strings, etc. — none of which are secrets).
  const inFence = new Array<boolean>(lines.length).fill(false);
  {
    let fenceOpen = false;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t.startsWith("```") || t.startsWith("~~~")) {
        // Toggle on every fence line; fence lines themselves are considered
        // "inside" for entropy purposes.
        inFence[i] = true;
        fenceOpen = !fenceOpen;
      } else {
        inFence[i] = fenceOpen;
      }
    }
  }

  // -- Secret & injection rules (line-aware) --
  lines.forEach((line, i) => {
    const lineNo = i + 1;

    for (const rule of SECRET_RULES) {
      rule.rx.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = rule.rx.exec(line))) {
        findings.push({
          id: uid(rule.id),
          severity: rule.severity,
          category: "secret",
          title: rule.title,
          detail: `Possible ${rule.title} detected. Rotate it immediately and never commit credentials to README files.`,
          line: lineNo,
          snippet: snippet(line, match.index, match[0].length),
        });
      }
    }

    for (const rule of INJECTION_RULES) {
      rule.rx.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = rule.rx.exec(line))) {
        findings.push({
          id: uid(rule.id),
          severity: rule.severity,
          category: "injection",
          title: rule.title,
          detail: `${rule.title} detected. The sanitizer blocks this at render time, but authors should avoid shipping it.`,
          line: lineNo,
          snippet: snippet(line, match.index, match[0].length),
        });
      }
    }

    // Entropy heuristic — skipped for lines inside code fences, and each line
    // gets its URLs and inline-code spans masked out before scanning. This
    // eliminates the flood of false positives on Shields.io badge URLs,
    // image hashes, and code-snippet content.
    if (inFence[i]) return;

    const masked = line
      // Full URLs (http/https/ftp/data) → blank out their token-ish substrings
      .replace(/(?:https?|ftp|data):\/\/\S+/gi, (m) => " ".repeat(m.length))
      // Inline markdown code spans `…` — can contain hashes, tokens, etc.
      .replace(/`[^`\n]+`/g, (m) => " ".repeat(m.length))
      // Image / link targets `![alt](url)` and `[text](url)` — mask the url
      .replace(/\]\(([^)]+)\)/g, (m) => " ".repeat(m.length));

    const tokenRx = /[A-Za-z0-9/_\-+=]{28,}/g;
    let tokMatch: RegExpExecArray | null;
    while ((tokMatch = tokenRx.exec(masked))) {
      const token = tokMatch[0];
      if (shannonEntropy(token) >= 4.3) {
        findings.push({
          id: uid("entropy"),
          severity: "medium",
          category: "secret",
          title: "High-entropy string",
          detail:
            "This string looks random enough to possibly be a credential. Review and redact if sensitive.",
          line: lineNo,
          snippet: snippet(line, tokMatch.index, token.length),
        });
      }
    }
  });

  // -- GRC compliance (whole-document) --
  for (const check of GRC_CHECKS) {
    if (!check.matcher.test(text)) {
      findings.push({
        id: uid(check.id),
        severity: "low",
        category: "grc",
        title: `Missing: ${check.title}`,
        detail: check.detail,
      });
    }
  }

  // Dedupe identical (category+title+line+snippet) tuples.
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.category}|${f.title}|${f.line ?? 0}|${f.snippet ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
