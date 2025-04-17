"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatSuggestions } from "@/components/chat/chat-suggestions";
import { Button } from "@/components/ui/button";
import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";

export function ChatLanding() {
    const router = useRouter();
    const [value, setValue] = useState("");

    const isDisabled = value.length === 0;

    const handleValueChange = useCallback((value: string) => {
        setValue(value);
    }, []);

    const handleClick = useCallback(() => {
        handleSubmit();
    }, []);

    const handleSubmit = useCallback((suggestion?: string) => {
        const input = suggestion ?? value;
        const searchParams = new URLSearchParams();
        searchParams.set("suggestion", input);

        router.push(`/chat/abc?${searchParams.toString()}`);
    }, []);

    return (
        <div className="flex w-full flex-col items-center gap-8 pt-32 md:pt-48">
            <h1 className="text-4xl font-semibold">
                What browser extension will you create?
            </h1>

            <div className="flex w-full max-w-3xl flex-col gap-2">
                <PromptInput
                    value={value}
                    onValueChange={handleValueChange}
                    onSubmit={handleSubmit}
                    className={cn("flex w-full max-w-3xl flex-row rounded-sm")}
                >
                    <PromptInputTextarea
                        placeholder="Type your message here..."
                        className="min-h-0 font-normal"
                    />

                    <PromptInputActions className="justify-end">
                        <PromptInputAction tooltip={"Send message"}>
                            <Button
                                variant="default"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={handleClick}
                                disabled={isDisabled}
                            >
                                <ArrowUpIcon className="size-5" />
                            </Button>
                        </PromptInputAction>
                    </PromptInputActions>
                </PromptInput>

                <ChatSuggestions
                    suggestions={[
                        "Add WHOIS information to Vercel Domains search",
                        "Open Github PR links in new tabs",
                    ]}
                    setInputValue={handleSubmit}
                />
            </div>
        </div>
    );
}
