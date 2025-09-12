import { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true },
  });
}

export async function requireRole(...roles: MembershipRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const membership = user.memberships[0];
  if (!membership || !roles.includes(membership.role)) {
    throw new Error("Forbidden");
  }
  return { user, membership };
}
