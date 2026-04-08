// Extend the global CloudflareEnv declared by @opennextjs/cloudflare
declare global {
  interface CloudflareEnv {
    DB: D1Database
  }
}

export {}
