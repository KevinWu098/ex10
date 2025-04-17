import React, { useState } from "react";
import { ChatMessageAssistant } from "@/components/chat/chat-message-assistant";
import { ChatMessageUser } from "@/components/chat/chat-message-user";
import { Message } from "@ai-sdk/react";

type MessageProps = {
    variant: Message["role"];
    children: string;
    id: string;
    attachments?: Message["experimental_attachments"];
    isLast?: boolean;
    // onDelete: (id: string) => void;
    // onEdit: (id: string, newText: string) => void;
    // onReload: () => void;
    hasScrollAnchor?: boolean;
};

export function ChatMessage({
    variant,
    children,
    id,
    attachments,
    isLast,
    // onDelete,
    // onEdit,
    // onReload,
    hasScrollAnchor,
}: MessageProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 500);
    };

    if (variant === "user") {
        return (
            <ChatMessageUser
                copied={copied}
                copyToClipboard={copyToClipboard}
                // onReload={onReload}
                // onEdit={onEdit}
                // onDelete={onDelete}
                id={id}
                hasScrollAnchor={hasScrollAnchor}
                attachments={attachments}
            >
                {children}
            </ChatMessageUser>
        );
    }

    if (variant === "assistant") {
        return (
            <ChatMessageAssistant
                copied={copied}
                copyToClipboard={copyToClipboard}
                // onReload={onReload}
                isLast={isLast}
                hasScrollAnchor={hasScrollAnchor}
            >
                {children}
            </ChatMessageAssistant>
        );
    }

    return null;
}
