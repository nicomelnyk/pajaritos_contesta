import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Required for Vercel deployment
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        params: {
          scope: "email public_profile groups_access_member_info publish_to_groups",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store the Facebook access token in the JWT
      if (account) {
        token.accessToken = account.access_token;
        token.providerAccountId = account.providerAccountId;
      }
      if (profile) {
        token.id = profile.id;
        token.name = profile.name;
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the access token to the client session
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

