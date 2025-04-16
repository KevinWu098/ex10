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
import type { ChatRequestOptions } from "ai";
import { ArrowUpIcon, SquareIcon } from "lucide-react";

interface ChatInputProps {
    input: string;
    isLoading: boolean;
    handleStop: VoidFunction;
    handleValueChange: (value: string) => void;
    handleSubmit: UseChatHelpers["handleSubmit"];
    className?: string;
}

export function ChatInput({
    input,
    handleValueChange,
    handleStop,
    handleSubmit: submitChat,
    isLoading,
    className,
}: ChatInputProps) {
    const isDisabled = !isLoading && input.length === 0;

    const handleSubmit = useCallback(
        (
            event?: {
                preventDefault?: () => void;
            },
            chatRequestOptions?: ChatRequestOptions
        ) => {
            event?.preventDefault?.();

            submitChat(event, chatRequestOptions);
        },
        [submitChat]
    );

    const handleClick = useCallback(() => {
        if (!isLoading) {
            handleSubmit();
            return;
        }

        handleStop();
    }, [isLoading, handleSubmit, handleStop]);

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
