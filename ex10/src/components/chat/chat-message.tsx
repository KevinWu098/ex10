import React, { useState } from "react";
import { ChatMessageAssistant } from "@/components/chat/chat-message-assistant";
import { ChatMessageUser } from "@/components/chat/chat-message-user";
import { Message, UseChatHelpers } from "@ai-sdk/react";

type MessageProps = {
    message: Message;
    variant: Message["role"];
    children: string;
    id: string;
    attachments?: Message["experimental_attachments"];
    isLast?: boolean;

    hasScrollAnchor?: boolean;
    setMessages: UseChatHelpers["setMessages"];
    reload: UseChatHelpers["reload"];
};

export function ChatMessage({
    message,
    variant,
    children,
    id,
    attachments,
    isLast,

    setMessages,
    reload,
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
                message={message}
                copied={copied}
                copyToClipboard={copyToClipboard}
                id={id}
                hasScrollAnchor={hasScrollAnchor}
                attachments={attachments}
                setMessages={setMessages}
                reload={reload}
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
                reload={reload}
                isLast={isLast}
                hasScrollAnchor={hasScrollAnchor}
                setMessages={setMessages}
                id={id}
            >
                {children}
            </ChatMessageAssistant>
        );
    }

    return null;
}
