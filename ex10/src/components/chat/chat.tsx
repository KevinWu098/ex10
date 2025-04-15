"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ObjectMessage } from "@/lib/message";

interface ChatProps {
    messages: ObjectMessage[];
    isLoading: boolean;
    input: string;
    onValueChange: (value: string) => void;
    onSubmit: () => void;
    onStop: () => void;
}

export function Chat({
    messages,
    isLoading,
    input,
    onStop,
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
                isLoading={isLoading}
                handleStop={onStop}
                handleValueChange={onValueChange}
                handleSubmit={onSubmit}
                className="w-full mt-auto"
            />
        </div>
    );
}
