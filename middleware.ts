import { withAuth } from "next-auth/middleware";

export default withAuth (
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    if(path.startsWith("/admin")) {
      if (role !== "ADMIN") return Response.redirect(new URL("/unauthorized", req.url));
    }

    if(path.startsWith("/user")) {
      if (role !== "USER") return Response.redirect(new URL("/unauthorized", req.url));
    }

    if(path.startsWith("/collector")) {
      if (role !== "COLLECTOR") return Response.redirect(new URL ("/unauthorized", req.url));
    }
  },

  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn:"/onboarding/login",
    }
  }
)

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/collector/:path*"]
}