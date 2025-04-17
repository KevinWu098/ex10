import { cookies } from "next/headers";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { NavMenu } from "@/components/sidebar/nav-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function Layout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

    return (
        <SidebarProvider
            className="max-h-dvh"
            defaultOpen={defaultOpen}
        >
            <NavMenu />
            <AppSidebar />
            <SidebarInset className="flex items-center">
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
