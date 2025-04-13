import React, { useState } from "react";
import { ChatMessageAssistant } from "@/components/chat/chat-message-assistant";
import { ChatMessageUser } from "@/components/chat/chat-message-user";
import { Message as MessageType } from "@ai-sdk/react";

type MessageProps = {
    variant: MessageType["role"];
    children: string;
    id: string;
    attachments?: MessageType["experimental_attachments"];
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
                children={children}
                copied={copied}
                copyToClipboard={copyToClipboard}
                // onReload={onReload}
                // onEdit={onEdit}
                // onDelete={onDelete}
                id={id}
                hasScrollAnchor={hasScrollAnchor}
                attachments={attachments}
            />
        );
    }

    if (variant === "assistant") {
        return (
            <ChatMessageAssistant
                children={children}
                copied={copied}
                copyToClipboard={copyToClipboard}
                // onReload={onReload}
                isLast={isLast}
                hasScrollAnchor={hasScrollAnchor}
            />
        );
    }

    return null;
}
