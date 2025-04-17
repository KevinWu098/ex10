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
import { createChat } from "@/lib/actions";
import { appendChatToLocalStorage, cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";

interface ChatLandingProps {
    id: string;
}

export function ChatLanding({ id }: ChatLandingProps) {
    const router = useRouter();
    const [value, setValue] = useState("");
    // NB: To differentiate which suggestion is being loaded, we use the (truthy) input value as the loading state
    const [isLoading, setIsLoading] = useState<string | undefined>();

    const isDisabled = value.length === 0;

    const handleValueChange = useCallback((value: string) => {
        setValue(value);
    }, []);

    const handleSubmit = useCallback(
        async (suggestion?: string) => {
            const input = suggestion ?? value;

            const searchParams = new URLSearchParams();
            searchParams.set("initialInput", input);

            try {
                setIsLoading(input);
                await createChat({ id, title: input });
                appendChatToLocalStorage(id);
                router.push(`/chat/${id}?${searchParams.toString()}`);
            } catch (error) {
                console.error("Failed to create chat:", error);
                toast.error("Failed to create chat");
            } finally {
                setIsLoading(undefined);
            }
        },
        [id, router, value]
    );

    const handleClick = useCallback(async () => {
        await handleSubmit();
    }, [handleSubmit]);

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
                        "Make the page background red",
                    ]}
                    setInputValue={handleSubmit}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
