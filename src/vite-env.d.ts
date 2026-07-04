/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_SECRET?: string
  readonly VITE_AMAP_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}