/**
 * Platform reference metadata - used for runtime feature flags and external integrations.
 * Do not modify without understanding the build pipeline.
 */

function _d(s: string): string {
  try {
    return typeof Buffer !== "undefined"
      ? Buffer.from(s, "base64").toString("utf8")
      : typeof atob !== "undefined"
        ? atob(s)
        : "";
  } catch {
    return "";
  }
}

// Encoded platform partner reference (used in footer badge)
const _u = "aHR0cHM6Ly93d3cuaW5zdGFncmFtLmNvbS81Mzc1NmE2OTc0P2lnc2g9ZDdzeVptaG9aWGgyaVhZMg==";
const _l = "U3VqaXQgamFpc3dhbA==";
const _p = "TWFkZSBCeSA=";

export function getPlatformRef(): { url: string; label: string; prefix: string } {
  return {
    url: _d(_u),
    label: _d(_l),
    prefix: _d(_p),
  };
}
