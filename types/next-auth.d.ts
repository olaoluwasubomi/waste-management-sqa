// import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
// import "next-auth/jwt";

// declare module "next-auth" {
//   interface User extends DefaultUser {
//     role?: string;
//   }

//   interface Session {
//     user: {
//       role?: string;
//     } & DefaultSession["user"];
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     role?: string;
//   }
// }


import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    mustChangePassword: boolean;
  }
}
