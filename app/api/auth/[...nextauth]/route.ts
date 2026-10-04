import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { AuthOptions } from "next-auth";

export const authOptions : AuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email and password required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Incorrect password");
        }

        // Return user object – NextAuth stores this in the session
        return {
          id: user.id,
          name: user.firstName + " " + user.lastName,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/onboarding/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; // attach role to JWT
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role; // attach role to session
        session.user.id = token.id;
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },


  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
