"use client";

import { useCallback, useState } from "react";
import { Message } from "@/app/(chat)/chat/[...id]/page";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { Message as UIMessage, useChat } from "@ai-sdk/react";

interface ChatProps {
    messages: Message[];
    isLoading: boolean;
    input: string;
    onValueChange: (value: string) => void;
    onSubmit: () => void;
}

export function Chat({
    messages,
    isLoading,
    input,
    onValueChange,
    onSubmit,
}: ChatProps) {
    const UiMessages = messages.map((message) => ({
        id: crypto.randomUUID(),
        role: message.role,
        content: message.content.find((c) => c.type === "text")?.text || "",
        experimental_attachments: [],
    }));

    return (
        <div className="flex flex-col items-center w-full max-w-3xl">
            <ChatMessages
                messages={UiMessages}
                isLoading={isLoading}
            />

            <ChatInput
                input={input}
                handleValueChange={onValueChange}
                handleSubmit={onSubmit}
                isLoading={isLoading}
                className="w-full mt-auto"
            />
        </div>
    );
}
