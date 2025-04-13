import { SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarIcon } from "lucide-react";

export function NavToggle() {
    return (
        <SidebarTrigger className="absolute top-3 left-3 z-50 size-10 rounded-[12px]" />
    );
}
