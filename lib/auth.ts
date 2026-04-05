import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@auth/d1-adapter"

export const { handlers, auth, signIn, signOut } = NextAuth((req) => ({
  trustHost: true,
  providers: [Google],
  adapter: D1Adapter((req as any).env.DB),
  callbacks: {
    async session({ session, user }) {
      if (session.user) session.user.id = user.id
      return session
    },
  },
}))
