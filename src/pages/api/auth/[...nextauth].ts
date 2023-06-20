import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/github";
import GithubProvider from "next-auth/providers/google";

const {
  GOOGLE_ID = "",
  GOOGLE_SECRET = "",
  GITHUB_ID = "",
  GITHUB_SECRET = "",
} = process.env;
// This is the temp big daddy of scripts I've been working on
// This is a simple implementation of OAuth with 2 providers
// My main auth script that uses credentials is still WIP
export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: "process.env.GITHUB_ID",
      clientSecret: "process.env.GITHUB_SECRET",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      token.userRole = "admin";
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl; // redirect callback
    },
  },
};

export default NextAuth(authOptions);
