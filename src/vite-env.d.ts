/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ROTMG_STASH_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
