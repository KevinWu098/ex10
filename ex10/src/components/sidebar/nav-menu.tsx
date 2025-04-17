"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";

export function NavMenu() {
    const pathname = usePathname();
    const { open } = useSidebar();

    const disabled = pathname === "/";

    return (
        <div
            className={cn(
                "bg-muted pointer-events-auto fixed top-2 left-2 z-50 m-2 space-x-0.5 rounded-sm p-1",
                open ? "bg-sidebar" : ""
            )}
        >
            <SidebarTrigger className="hover:bg-muted-foreground/10 size-6 cursor-pointer rounded-sm" />
            <Button
                className={cn(
                    "hover:bg-muted-foreground/10 size-6 cursor-pointer rounded-sm",
                    open ? "hidden" : ""
                )}
                variant="ghost"
                size="icon"
                disabled={disabled}
            >
                <Link href="/">
                    <PlusIcon />
                </Link>
            </Button>
        </div>
    );
}
