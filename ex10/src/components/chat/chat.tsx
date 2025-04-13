"use client";

import { useCallback, useState } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { useChat } from "@ai-sdk/react";

export function Chat() {
    const handleValueChange = useCallback((value: string) => {
        setInput(value);
    }, []);

    const {
        messages,
        // setMessages,
        handleSubmit,
        input,
        setInput,
        status,
        stop,
    } = useChat({
        // id,
        // body: { id, selectedChatModel: selectedChatModel },
        // initialMessages,
        experimental_throttle: 100,
        // sendExtraMessageFields: true,
        // generateId: generateUUID,
        // onFinish: () => {
        //     mutate(unstable_serialize(getChatHistoryPaginationKey));
        // },
        // onError: () => {
        //     toast.error("An error occurred, please try again!");
        // },
    });

    return (
        <div className="flex h-full w-full flex-col items-center">
            <ChatMessages
                messages={messages}
                status={status}
            />

            <ChatInput
                input={input}
                handleValueChange={handleValueChange}
                handleSubmit={handleSubmit}
                status={status}
                className="mt-auto w-full"
            />
        </div>
    );
}
