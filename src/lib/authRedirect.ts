// Login URL that brings the user back to the page they were on once they sign in.
export function loginPath(next = window.location.pathname + window.location.search): string {
  return `/login?next=${encodeURIComponent(next)}`;
}

// Only allow same-site paths as a post-login destination.
export function safeNext(raw: string | null | undefined, fallback = "/home"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login") || raw.startsWith("/signup")) {
    return fallback;
  }
  return raw;
}
