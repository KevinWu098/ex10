import { UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
    const userMessages = messages.filter((message) => message.role === "user");
    return userMessages.at(-1);
}

export function getTrailingMessageId({
    messages,
}: {
    messages: Array<UIMessage>;
}): string | null {
    const trailingMessage = messages.at(-1);

    if (!trailingMessage) return null;

    return trailingMessage.id;
}

export function appendChatToLocalStorage(id: string) {
    const savedChats = localStorage.getItem("ex10Chats");
    let chats: string[] = [];

    if (savedChats) {
        chats = JSON.parse(savedChats);
    }

    if (!chats.includes(id)) {
        chats.push(id);
        localStorage.setItem("ex10Chats", JSON.stringify(chats));
    }
}
