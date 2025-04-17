"use client";

import * as React from "react";
import Link from "next/link";
import { SidebarHistory } from "@/components/sidebar/sidebar-history";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SiGithub } from "@icons-pack/react-simple-icons";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar
            variant="inset"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu className="mt-[7px]">
                    <Link
                        href="/"
                        className="mx-auto flex"
                    >
                        <div className="my-auto grid h-fit flex-1 text-left text-lg leading-none">
                            <span className="h-fit truncate font-mono font-medium">
                                ex10.dev
                            </span>
                        </div>
                    </Link>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarHistory />
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem className="mx-auto flex gap-2">
                        <Link
                            href="https://github.com/kevinwu098/ex10"
                            target="_blank"
                            referrerPolicy="no-referrer"
                        >
                            <SiGithub />
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
