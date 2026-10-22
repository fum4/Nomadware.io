// Files whose line counts say nothing about the work: lockfiles, generated code, build output,
// minified bundles, test snapshots. The one list; "lines changed" sums every other file.
export const EXCLUDED_PATH_PATTERNS: readonly RegExp[] = [
  // Lockfiles
  /(^|\/)(pnpm-lock\.yaml|package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|bun\.lockb?|Cargo\.lock|go\.sum|poetry\.lock|uv\.lock|Gemfile\.lock|composer\.lock|Podfile\.lock|flake\.lock|pubspec\.lock|mix\.lock)$/,
  /\.lock(\.hcl)?$/,
  // Build output and generated code
  /(^|\/)(dist|build|out|\.next|\.astro|\.vercel)\//,
  /(^|\/)(generated|__generated__|gen)\//,
  /\.(generated|gen)\.[^/]+$/,
  /\.min\.[^/]+$/,
  /\.map$/,
  // Snapshots: Jest/Vitest, and migration tools' schema snapshots (drizzle meta/*_snapshot.json)
  /(^|\/)__snapshots__\//,
  /\.snap$/,
  /(^|\/)meta\/[^/]*_snapshot\.json$/,
];

export function isExcludedPath(path: string): boolean {
  return EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(path));
}
