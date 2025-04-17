import { ChatMessage } from "@/components/chat/chat-message";
import { Message, UseChatHelpers } from "@ai-sdk/react";
import { UIMessage } from "ai";

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
                >
                    {part.text}
                </ChatMessage>
            );
        }

        return null;
    });
}
