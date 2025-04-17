"use client";

import { memo } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { UIMessage } from "ai";
import { UseChatHelpers } from "ai/react";

interface ChatProps {
    messages: UIMessage[];
    status: UseChatHelpers["status"];
    input: string;
    onValueChange: (value: string) => void;
    onSubmit: () => void;
    onStop: () => void;
    reload: UseChatHelpers["reload"];
    setMessages: UseChatHelpers["setMessages"];
}

export const Chat = memo(
    ({
        messages,
        status,
        input,
        onStop,
        onValueChange,
        onSubmit,
        reload,
        setMessages,
    }: ChatProps) => {
        const isLoading = status === "streaming" || status === "submitted";

        return (
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
                <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    reload={reload}
                    setMessages={setMessages}
                />

                <ChatInput
                    input={input}
                    isLoading={isLoading}
                    handleStop={onStop}
                    handleValueChange={onValueChange}
                    handleSubmit={onSubmit}
                    className="mt-auto w-full"
                />
            </div>
        );
    }
);

Chat.displayName = "Chat";
