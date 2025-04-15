import { useRef } from "react";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatContainer } from "@/components/ui/chat-container";
import { Message } from "@/components/ui/message";
import { ScrollButton } from "@/components/ui/scroll-button";
import type { Message as MessageType, UseChatHelpers } from "@ai-sdk/react";
import { LoaderIcon } from "lucide-react";

interface ChatMessagesProps {
    messages: MessageType[];
    isLoading: boolean;
    // onDelete
    // onEdit
    // onReload
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
    const initialMessageCount = useRef(messages.length);
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    if (!messages?.length) return <div className="w-full h-full" />;

    return (
        <div className="relative flex flex-col items-center w-full overflow-hidden">
            <ChatContainer
                className="relative flex flex-col items-center w-full pt-20 pb-4"
                autoScroll={true}
                ref={containerRef}
                scrollToRef={scrollRef}
                style={{
                    scrollbarGutter: "stable both-edges",
                }}
            >
                {messages.map((message, index) => {
                    const isLast = index === messages.length - 1 && !isLoading;
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

                {isLoading &&
                    messages.length > 0 &&
                    messages.at(messages.length - 1)?.role === "user" && (
                        <div className="flex flex-col items-start w-full max-w-3xl gap-2 px-6 pb-2 group min-h-scroll-anchor">
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
