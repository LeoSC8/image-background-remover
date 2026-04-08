import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@auth/d1-adapter"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const { env } = getCloudflareContext()
  return {
    trustHost: true,
    secret: env.AUTH_SECRET,
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    adapter: D1Adapter(env.DB as any),
    callbacks: {
      async session({ session, user }) {
        if (session.user) session.user.id = user.id
        return session
      },
    },
  }
})
