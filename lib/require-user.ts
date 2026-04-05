import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";

export async function requireUserId(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return {
      response: NextResponse.json(
        { error: "Sign in required.", code: "UNAUTHORIZED" },
        { status: 401 },
      ),
    };
  }
  return { userId };
}
