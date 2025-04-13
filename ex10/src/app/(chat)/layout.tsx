import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { NavToggle } from "@/components/sidebar/nav-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider
            defaultOpen={false}
            className="max-h-dvh"
        >
            <NavToggle />
            <AppSidebar />
            <SidebarInset className="flex items-center">
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
