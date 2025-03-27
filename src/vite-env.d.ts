/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ROTMG_STASH_ASSETS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
