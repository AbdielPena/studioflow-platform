"use server";

import { signOut } from "@/packages/auth";

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
