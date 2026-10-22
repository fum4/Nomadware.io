interface ImportMetaEnv {
  /** Build time (ISO 8601), fixed by astro.config.ts `vite.define`: "last deploy" in the footer. */
  readonly BUILT_AT: string;
}
