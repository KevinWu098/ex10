import { ChatMessage } from "@/components/chat/chat-message";
import { Button } from "@/components/ui/button";
import { Message } from "@ai-sdk/react";
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
}

export function ChatMessageParts({
    messageId,
    messageRole,
    parts,
    isLast,
    hasScrollAnchor,
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
                    // onDelete={onDelete}
                    // onEdit={onEdit}
                    // onReload={onReload}
                    hasScrollAnchor={hasScrollAnchor}
                >
                    {part.text}
                </ChatMessage>
            );
        }

        // if (type === "tool-invocation") {
        //     const { toolInvocation } = part;
        //     const { toolName, toolCallId, state } = toolInvocation;

        //     if (state === "call") {
        //         const { args } = toolInvocation;

        //         return (
        //             <div
        //                 key={toolCallId}
        //                 className={cx({
        //                     skeleton: ["getWeather"].includes(toolName),
        //                 })}
        //             >
        //                 {toolName === "getWeather" ? (
        //                     <Weather />
        //                 ) : toolName === "createDocument" ? (
        //                     <DocumentPreview
        //                         isReadonly={isReadonly}
        //                         args={args}
        //                     />
        //                 ) : toolName === "updateDocument" ? (
        //                     <DocumentToolCall
        //                         type="update"
        //                         args={args}
        //                         isReadonly={isReadonly}
        //                     />
        //                 ) : toolName === "requestSuggestions" ? (
        //                     <DocumentToolCall
        //                         type="request-suggestions"
        //                         args={args}
        //                         isReadonly={isReadonly}
        //                     />
        //                 ) : null}
        //             </div>
        //         );
        //     }
        // }

        return null;
    });
}
