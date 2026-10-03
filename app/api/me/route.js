import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({
    user: user
      ? { id: user.id, name: user.name, role: user.role }
      : null,
  });
}
