import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";

// Use stable production domain or VERCEL_URL (automatically set by Vercel)
const getBaseUrl = () => {
  // If NEXTAUTH_URL is explicitly set, use it
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  
  // Use stable production domain (doesn't change with deployments)
  if (process.env.VERCEL) {
    return `https://pajaritoscontesta.vercel.app`;
  }
  
  // Fallback for local development
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Required for Vercel deployment
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET, // Support both env var names
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        params: {
          scope: "email public_profile user_posts",
          // Note: groups_access_member_info and publish_to_groups were deprecated by Facebook in 2024
          // Trying user_posts to see if it helps access posts (though group posts may still be blocked)
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

