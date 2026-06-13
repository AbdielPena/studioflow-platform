import { redirect } from "next/navigation";
import { getSessionContext } from "@/packages/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarMobileProvider } from "@/components/layout/sidebar-mobile";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  return (
    <SidebarMobileProvider>
      <div className="flex min-h-screen">
        <Sidebar
          permissions={ctx.permissions}
          isOwner={ctx.isOwner}
          systemRole={ctx.systemRole}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            user={{
              name: null,
              email: ctx.email,
              systemRole: ctx.systemRole,
            }}
          />
          <main className="flex-1 overflow-y-auto bg-muted/20">{children}</main>
        </div>
      </div>
    </SidebarMobileProvider>
  );
}
