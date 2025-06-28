import { ChatMessage } from "@/components/chat/chat-message";
import { Message as MessageContainer } from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { Message, UseChatHelpers } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { LoaderIcon } from "lucide-react";

interface ChatMessagePartsProps {
    messageId: string;
    messageRole: UIMessage["role"];
    parts: UIMessage["parts"];
    attachments?: Message["experimental_attachments"];
    isLast?: boolean;
    // onDelete: (id: string) => void;
    // onEdit: (id: string, newText: string) => void;
    // onReload: () => void;
    hasScrollAnchor?: boolean;
    reload: UseChatHelpers["reload"];
    setMessages: UseChatHelpers["setMessages"];
    message: Message;
    isLoading: boolean;
}

export function ChatMessageParts({
    messageId,
    messageRole,
    parts,
    isLast,
    hasScrollAnchor,
    reload,
    setMessages,
    message,
    isLoading,
}: ChatMessagePartsProps) {
    return parts?.map((part, index) => {
        const { type } = part;
        const key = `message-${messageId}-part-${index}`;

        if (type === "text") {
            return (
                <ChatMessage
                    key={key}
                    variant={messageRole}
                    id={messageId}
                    isLast={isLast}
                    reload={reload}
                    hasScrollAnchor={hasScrollAnchor}
                    message={message}
                    setMessages={setMessages}
                    isLoading={isLoading}
                >
                    {part.text}
                </ChatMessage>
            );
        }

        if (type === "tool-invocation") {
            const previousPart = parts.at(Math.max(0, index - 1));
            if (
                previousPart?.type === "tool-invocation" &&
                previousPart.toolInvocation.state !== "result"
            ) {
                return null;
            }

            if (part.toolInvocation.state !== "result") {
                return (
                    <div
                        className="group min-h-scroll-anchor flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2"
                        key={key}
                    >
                        <LoaderIcon />
                    </div>
                );
            }

            // TODO: Add tool invocation result
            return null;
            // <MessageContainer
            //     className={cn(
            //         "group flex w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2",
            //         hasScrollAnchor && "min-h-scroll-anchor"
            //     )}
            // >
            //     foobar
            // </MessageContainer>
        }

        return null;
    });
}
