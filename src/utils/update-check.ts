const GITHUB_OWNER = 'link3337';
const GITHUB_REPO = 'rotmg-stash';
const SEMVER_IN_TAG_REGEX = /v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/i;

export type GithubUpdateCheckResult = {
  latestTag: string | null;
  releaseUrl: string | null;
  hasUpdate: boolean;
  error: string | null;
};

function extractSemver(value: string): string | null {
  const match = value.trim().match(SEMVER_IN_TAG_REGEX);
  return match?.[1] ?? null;
}

export function normalizeVersion(version: string): string {
  const extracted = extractSemver(version);
  if (extracted) return extracted;

  return version.trim().replace(/^v/i, '');
}

function parseVersion(version: string): number[] {
  const normalized = normalizeVersion(version).split('-')[0].split('+')[0];
  return normalized
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

export function compareVersions(a: string, b: string): number {
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLen = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLen; i += 1) {
    const aValue = aParts[i] ?? 0;
    const bValue = bParts[i] ?? 0;

    if (aValue > bValue) return 1;
    if (aValue < bValue) return -1;
  }

  return 0;
}

export async function checkGithubUpdate(
  installedVersion: string
): Promise<GithubUpdateCheckResult> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    );

    if (!response.ok) {
      throw new Error(`GitHub request failed (${response.status})`);
    }

    const latestRelease = (await response.json()) as { tag_name?: string; html_url?: string };
    const latestTag = latestRelease.tag_name;

    if (!latestTag || !extractSemver(latestTag)) {
      throw new Error('No valid release tag found');
    }

    const releaseUrl =
      latestRelease.html_url ??
      `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${latestTag}`;

    return {
      latestTag,
      releaseUrl,
      hasUpdate: compareVersions(latestTag, installedVersion) > 0,
      error: null
    };
  } catch (error) {
    return {
      latestTag: null,
      releaseUrl: null,
      hasUpdate: false,
      error: error instanceof Error ? error.message : 'Failed to check updates'
    };
  }
}
