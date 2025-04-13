import { Button } from "@/components/ui/button";
import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { ArrowUpIcon, SquareIcon } from "lucide-react";

interface ChatInputProps {
    input: string;
    isLoading: boolean;
    handleValueChange: (value: string) => void;
    handleSubmit: () => void;
}

export function ChatInput({
    input,
    isLoading,
    handleValueChange,
    handleSubmit,
}: ChatInputProps) {
    return (
        <PromptInput
            value={input}
            onValueChange={handleValueChange}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            className="flex w-full max-w-3xl flex-row rounded-lg"
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
                        onClick={handleSubmit}
                    >
                        {isLoading ? (
                            <SquareIcon className="size-5 fill-current" />
                        ) : (
                            <ArrowUpIcon className="size-5" />
                        )}
                    </Button>
                </PromptInputAction>
            </PromptInputActions>
        </PromptInput>
    );
}
