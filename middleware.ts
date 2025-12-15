import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // `withAuth` handles redirects for unauthorized users.
  },
  {
    callbacks: {
      authorized: ({ token }) => token?.role === "ADMIN",
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*"],
};
