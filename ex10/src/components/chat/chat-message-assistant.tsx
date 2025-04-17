import {
    Message,
    MessageAction,
    MessageActions,
    MessageContent,
} from "@/components/ui/message";
import { deleteTrailingMessages } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import { CheckIcon, CopyIcon, RotateCwIcon } from "lucide-react";

type MessageAssistantProps = {
    children: string;
    isLast?: boolean;
    hasScrollAnchor?: boolean;
    copied?: boolean;
    copyToClipboard?: () => void;
    reload: UseChatHelpers["reload"];
    setMessages: UseChatHelpers["setMessages"];
    id: string;
};

export function ChatMessageAssistant({
    children,
    isLast,
    hasScrollAnchor,
    copied,
    copyToClipboard,
    reload: _reload,
    setMessages: _setMessages,
    id: _id,
}: MessageAssistantProps) {
    return (
        <Message
            className={cn(
                "group flex w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2",
                hasScrollAnchor && "min-h-scroll-anchor"
            )}
        >
            <div
                className={cn(
                    "flex min-w-full flex-col gap-2",
                    isLast && "pb-8"
                )}
            >
                <MessageContent
                    className="prose dark:prose-invert relative min-w-full bg-transparent p-0"
                    markdown={true}
                >
                    {children}
                </MessageContent>

                <MessageActions
                    className={cn(
                        "flex gap-0 opacity-0 transition-opacity group-hover:opacity-100"
                    )}
                >
                    <MessageAction
                        tooltip={copied ? "Copied!" : "Copy text"}
                        side="bottom"
                        delayDuration={0}
                    >
                        <button
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                            aria-label="Copy text"
                            onClick={copyToClipboard}
                            type="button"
                        >
                            {copied ? (
                                <CheckIcon className="size-4" />
                            ) : (
                                <CopyIcon className="size-4" />
                            )}
                        </button>
                    </MessageAction>
                    {/* <MessageAction
                        tooltip="Regenerate"
                        side="bottom"
                        delayDuration={0}
                    >
                        <button
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                            aria-label="Regenerate"
                            onClick={handleReload}
                            type="button"
                        >
                            <RotateCwIcon className="size-4" />
                        </button>
                    </MessageAction> */}
                </MessageActions>
            </div>
        </Message>
    );
}
