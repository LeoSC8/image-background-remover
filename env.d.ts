// Cloudflare Workers / Pages runtime type declarations

interface CloudflareEnv {
  DB: D1Database
}

declare global {
  // Makes process.env aware of the D1 binding when accessed via type cast
  // Use: const env = process.env as unknown as CloudflareEnv
}

export {}
