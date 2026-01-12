/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALPACA_API_KEY: string
  readonly VITE_ALPACA_SECRET_KEY: string
  readonly VITE_ALPACA_USE_PAPER: string
  readonly VITE_ALPHA_VANTAGE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
