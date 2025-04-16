"use client";

import { useCallback, useState } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSuggestions } from "@/components/chat/chat-suggestions";

export function ChatLanding() {
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleValueChange = useCallback((value: string) => {
        setValue(value);
    }, []);

    const handleSubmit = useCallback(() => {
        setIsLoading(true);
    }, []);

    return (
        <div className="flex w-full flex-col items-center gap-8 pt-32 md:pt-48">
            <h1 className="text-4xl font-semibold">
                What browser extension will you create?
            </h1>

            <div className="flex w-full max-w-3xl flex-col gap-2">
                {/* TODO: FIX THIS */}
                <ChatInput
                    input={value}
                    isLoading={isLoading}
                    handleValueChange={handleValueChange}
                    handleSubmit={handleSubmit}
                    handleStop={() => {}}
                />
                <ChatSuggestions
                    suggestions={[
                        "Add WHOIS information to Vercel Domains search",
                        "Open Github PR links in new tabs",
                    ]}
                    setInputValue={setValue}
                />
            </div>
        </div>
    );
}
