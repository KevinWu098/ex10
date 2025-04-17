"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Chat } from "@/db/schema";
import { getChatsById } from "@/lib/actions";

export function SidebarHistory() {
    const pathname = usePathname();
    const [chats, setChats] = useState<string[]>([]);
    const [dbChats, setDbChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!Array.isArray(chats)) {
            console.error("Expected chats to be string[], got:", typeof chats);
            return;
        }

        if (
            !Array.isArray(chats) ||
            !chats.every((chat) => typeof chat === "string")
        ) {
            console.error("All elements in array must be strings");
            return;
        }

        setIsLoading(true);
        getChatsById({ ids: chats })
            .then((result) => {
                setDbChats(result ?? []);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [chats]);

    useEffect(() => {
        const savedChats = localStorage.getItem("ex10Chats");

        if (savedChats) {
            setChats(JSON.parse(savedChats));
        } else {
            setIsLoading(false);
        }
    }, []);

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarMenu>
                {isLoading ? (
                    <>
                        <SidebarMenuItem>
                            <Skeleton className="bg-muted h-8 w-full" />
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Skeleton className="bg-muted h-8 w-full" />
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Skeleton className="bg-muted h-8 w-full" />
                        </SidebarMenuItem>
                    </>
                ) : dbChats.length > 0 ? (
                    dbChats
                        .sort((a, b) => (a.createdAt <= b.createdAt ? 1 : -1))
                        .map((c) => (
                            <SidebarMenuItem key={c.id}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={c.title}
                                    isActive={pathname === `/chat/${c.id}`}
                                >
                                    <Link
                                        href={`/chat/${c.id}`}
                                        prefetch={true}
                                    >
                                        <span className="truncate">
                                            {c.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))
                ) : (
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            No chats yet
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
