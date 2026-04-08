// Extend the global CloudflareEnv declared by @opennextjs/cloudflare
declare global {
  interface CloudflareEnv {
    DB: D1Database
    AUTH_SECRET: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    AUTH_URL: string
  }
}

export {}
