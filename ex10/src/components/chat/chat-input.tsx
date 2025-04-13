"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";

interface ChatInputProps {
    input: string;
    handleValueChange: (value: string) => void;
    handleSubmit: UseChatHelpers["handleSubmit"];
    status: UseChatHelpers["status"];
    className?: string;
}

export function ChatInput({
    input,
    handleValueChange,
    handleSubmit: submitChat,
    status,
    className,
}: ChatInputProps) {
    const isLoading = status === "submitted" || status === "streaming";
    const isDisabled = status === "ready" && input.length === 0;

    const handleClick = useCallback(() => {
        console.log("hit");
        if (status === "ready") {
            handleSubmit();
            return;
        }

        stop();
    }, [status, stop]);

    const handleSubmit = useCallback(
        (
            event?: {
                preventDefault?: () => void;
            },
            chatRequestOptions?: any
        ) => {
            event?.preventDefault?.();

            submitChat(event, chatRequestOptions);
        },
        [submitChat]
    );

    return (
        <PromptInput
            value={input}
            onValueChange={handleValueChange}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            className={cn(
                "flex w-full max-w-3xl flex-row rounded-sm",
                className
            )}
        >
            <PromptInputTextarea
                placeholder="Type your message here..."
                className="min-h-0 font-normal"
            />

            <PromptInputActions className="justify-end">
                <PromptInputAction
                    tooltip={isLoading ? "Stop generation" : "Send message"}
                >
                    <Button
                        variant="default"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleClick}
                        disabled={isDisabled}
                    >
                        {isLoading ? (
                            <SquareIcon className="size-4 fill-current" />
                        ) : (
                            <ArrowUpIcon className="size-5" />
                        )}
                    </Button>
                </PromptInputAction>
            </PromptInputActions>
        </PromptInput>
    );
}
