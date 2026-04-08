import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@auth/d1-adapter"

// Access D1 binding from the Cloudflare request context set by OpenNext worker.
// Cannot use `import { getCloudflareContext } from "@opennextjs/cloudflare"` because
// it gets tree-shaken out of the worker bundle.
function getD1() {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-context__")]
  return ctx?.env?.DB
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getD1()
  console.log("[auth] DB binding:", db ? "OK" : "MISSING")
  console.log("[auth] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "OK" : "MISSING")
  console.log("[auth] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "OK" : "MISSING")
  console.log("[auth] AUTH_SECRET:", process.env.AUTH_SECRET ? "OK" : "MISSING")
  return {
    trustHost: true,
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    adapter: D1Adapter(db as any),
    callbacks: {
      async session({ session, user }) {
        if (session.user) session.user.id = user.id
        return session
      },
    },
    logger: {
      error(error) {
        console.error("[auth error]", error.name, (error as any).cause ?? error.message)
      },
    },
  }
})
