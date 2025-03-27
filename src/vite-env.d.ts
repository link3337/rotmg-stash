/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ROTMGSTASH_ASSETS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
