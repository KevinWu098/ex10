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
    return (
        <div className="flex w-full max-w-3xl flex-col items-center">
            <ChatMessages
                messages={messages}
                isLoading={isLoading}
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
