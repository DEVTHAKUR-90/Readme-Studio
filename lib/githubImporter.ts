/**
 * GitHub Importer – resolves any GitHub URL to its README.md via the
 * unauthenticated public REST API.
 *
 *   https://github.com/owner/repo          → fetches default branch README
 *   https://github.com/owner/repo/tree/dev  → fetches the `dev` branch README
 *
 * Returns decoded UTF-8 markdown. Throws on 404 / rate limit.
 */

export interface GitHubImportResult {
  owner: string;
  repo: string;
  branch?: string;
  content: string;
  sha: string;
  size: number;
}

const GITHUB_URL_RX =
  /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\/(?:tree|blob)\/([^/\s#?]+))?/i;

/** Parse a GitHub URL or `owner/repo` shorthand into its constituent parts. */
export function parseGitHubUrl(
  input: string,
): { owner: string; repo: string; branch?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // owner/repo shorthand
  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    const [owner, repo] = trimmed.split("/");
    return { owner, repo: repo.replace(/\.git$/, "") };
  }

  const m = trimmed.match(GITHUB_URL_RX);
  if (!m) return null;

  const [, owner, repoRaw, branch] = m;
  const repo = repoRaw.replace(/\.git$/, "");
  return { owner, repo, branch };
}

/**
 * Fetch README content from GitHub. Uses the `application/vnd.github.raw`
 * accept header so we get markdown straight-up (no base64 dance).
 */
export async function fetchGitHubReadme(
  input: string,
): Promise<GitHubImportResult> {
  const parsed = parseGitHubUrl(input);
  if (!parsed) {
    throw new Error(
      "Invalid GitHub URL. Try `https://github.com/owner/repo` or `owner/repo`.",
    );
  }
  const { owner, repo, branch } = parsed;

  const qs = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const metaUrl = `https://api.github.com/repos/${owner}/${repo}/readme${qs}`;

  const metaRes = await fetch(metaUrl, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });

  if (metaRes.status === 404) {
    throw new Error(
      `No README found for ${owner}/${repo}${branch ? `@${branch}` : ""}.`,
    );
  }
  if (metaRes.status === 403) {
    throw new Error(
      "GitHub API rate limit reached. Wait a minute or provide a PAT.",
    );
  }
  if (!metaRes.ok) {
    throw new Error(`GitHub API error: ${metaRes.status} ${metaRes.statusText}`);
  }

  const meta = (await metaRes.json()) as {
    sha: string;
    size: number;
    download_url: string;
  };

  const rawRes = await fetch(meta.download_url, { cache: "no-store" });
  if (!rawRes.ok) {
    throw new Error(`Failed to download README: ${rawRes.statusText}`);
  }
  const content = await rawRes.text();

  return { owner, repo, branch, content, sha: meta.sha, size: meta.size };
}
