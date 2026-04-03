import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { Account, User } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.sub
      return session
    },
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (!account) return true
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        await fetch(`${baseUrl}/api/user/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: `${account.provider}_${account.providerAccountId}`,
            email: user.email,
            name: user.name,
            image: user.image,
          }),
        })
      } catch {
        // Non-blocking
      }
      return true
    },
  },
}
