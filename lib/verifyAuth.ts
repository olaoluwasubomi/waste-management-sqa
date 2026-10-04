import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function verifyAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
}
