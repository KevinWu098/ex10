import { useRef } from "react";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatContainer } from "@/components/ui/chat-container";
import { Message } from "@/components/ui/message";
import { ScrollButton } from "@/components/ui/scroll-button";
import type { Message as MessageType, UseChatHelpers } from "@ai-sdk/react";
import { LoaderIcon } from "lucide-react";

interface ChatMessagesProps {
    messages: MessageType[];
    status: UseChatHelpers["status"];
    // onDelete
    // onEdit
    // onReload
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
    const initialMessageCount = useRef(messages.length);
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    if (!messages?.length) return <div className="h-full w-full" />;

    return (
        <div className="relative flex w-full flex-col items-center overflow-hidden">
            <ChatContainer
                className="relative flex w-full flex-col items-center pt-20 pb-4"
                autoScroll={true}
                ref={containerRef}
                scrollToRef={scrollRef}
                style={{
                    scrollbarGutter: "stable both-edges",
                }}
            >
                {messages.map((message, index) => {
                    const isLast =
                        index === messages.length - 1 && status !== "submitted";
                    const hasScrollAnchor =
                        isLast && messages.length > initialMessageCount.current;

                    return (
                        <ChatMessage
                            key={message.id}
                            id={message.id}
                            variant={message.role}
                            attachments={message.experimental_attachments}
                            isLast={isLast}
                            // onDelete={onDelete}
                            // onEdit={onEdit}
                            // onReload={onReload}
                            hasScrollAnchor={hasScrollAnchor}
                        >
                            {message.content}
                        </ChatMessage>
                    );
                })}

                {status === "submitted" &&
                    messages.length > 0 &&
                    messages.at(messages.length - 1)?.role === "user" && (
                        <div className="group min-h-scroll-anchor flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2">
                            <LoaderIcon />
                        </div>
                    )}
            </ChatContainer>

            <div className="absolute bottom-0 w-full max-w-3xl">
                <ScrollButton
                    className="absolute -top-10 right-2"
                    scrollRef={scrollRef}
                    containerRef={containerRef}
                />
            </div>
        </div>
    );
}
