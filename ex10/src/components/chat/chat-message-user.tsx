"use client";

import { useRef, useState } from "react";
// import {
//     MorphingDialog,
//     MorphingDialogClose,
//     MorphingDialogContainer,
//     MorphingDialogContent,
//     MorphingDialogImage,
//     MorphingDialogTrigger,
// } from "@/components/motion-primitives/morphing-dialog";
import { Button } from "@/components/ui/button";
import {
    MessageAction,
    MessageActions,
    Message as MessageContainer,
    MessageContent,
} from "@/components/ui/message";
import { deleteTrailingMessages } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Message, Message as MessageType, UseChatHelpers } from "@ai-sdk/react";
import { Check, Copy, Pencil, RotateCwIcon } from "lucide-react";

// const getTextFromDataUrl = (dataUrl: string) => {
//     const base64 = dataUrl.split(",")[1];
//     return base64;
// };

export type MessageUserProps = {
    message: Message;
    hasScrollAnchor?: boolean;
    attachments?: MessageType["experimental_attachments"];
    children: string;
    copied: boolean;
    copyToClipboard: () => void;
    // onEdit: (id: string, newText: string) => void;
    // onReload: () => void;
    // onDelete: (id: string) => void;
    id: string;
    setMessages: UseChatHelpers["setMessages"];
    reload: UseChatHelpers["reload"];
};

export function ChatMessageUser({
    message,
    hasScrollAnchor,
    attachments: _attachments,
    children,
    copied,
    copyToClipboard,
    // onEdit,
    // onReload,
    // onDelete,
    setMessages,
    id: id,
    reload,
}: MessageUserProps) {
    const [editInput, setEditInput] = useState(children);
    const [isEditing, setIsEditing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditInput(children);
    };

    const handleSave = async () => {
        setIsEditing(false);
        setIsSubmitting(true);

        await deleteTrailingMessages({ id });

        // @ts-expect-error todo: support UIMessage in setMessages
        setMessages((messages) => {
            const index = messages.findIndex((m) => m.id === id);

            if (index !== -1) {
                const updatedMessage = {
                    ...message,
                    content: editInput,
                    parts: [{ type: "text", text: editInput }],
                };

                return [...messages.slice(0, index), updatedMessage];
            }

            return messages;
        });

        setIsSubmitting(false);
        reload();
    };

    const handleReload = async () => {
        await deleteTrailingMessages({ id });

        setMessages((messages) => {
            const index = messages.findIndex((m) => m.id === id);

            if (index !== -1) {
                return [...messages.slice(0, index + 1)];
            }

            return messages;
        });

        reload();
    };

    return (
        <MessageContainer
            className={cn(
                "group flex w-full max-w-3xl flex-col items-end gap-2 px-6 pb-2",
                hasScrollAnchor && "min-h-scroll-anchor"
            )}
        >
            {/* {attachments?.map((attachment, index) => (
                <div
                    className="flex flex-row gap-2"
                    key={`${attachment.name}-${index}`}
                >
                    {attachment.contentType?.startsWith("image") ? (
                        <MorphingDialog
                            transition={{
                                type: "spring",
                                stiffness: 280,
                                damping: 18,
                                mass: 0.3,
                            }}
                        >
                            <MorphingDialogTrigger className="z-10">
                                <img
                                    className="w-40 mb-1 rounded-md"
                                    key={attachment.name}
                                    src={attachment.url}
                                    alt={attachment.name}
                                />
                            </MorphingDialogTrigger>
                            <MorphingDialogContainer>
                                <MorphingDialogContent className="relative rounded-lg">
                                    <MorphingDialogImage
                                        src={attachment.url}
                                        alt={attachment.name || ""}
                                        className="max-h-[90vh] max-w-[90vw] object-contain"
                                    />
                                </MorphingDialogContent>
                                <MorphingDialogClose className="text-primary" />
                            </MorphingDialogContainer>
                        </MorphingDialog>
                    ) : attachment.contentType?.startsWith("text") ? (
                        <div className="w-40 h-24 p-2 mb-3 overflow-hidden text-xs border rounded-md text-primary">
                            {getTextFromDataUrl(attachment.url)}
                        </div>
                    ) : null}
                </div>
            ))} */}
            {isEditing ? (
                <div
                    className="bg-accent relative flex min-w-[180px] flex-col gap-2 rounded-3xl px-5 py-2.5"
                    style={{
                        width: contentRef.current?.offsetWidth,
                    }}
                >
                    <textarea
                        className="w-full resize-none bg-transparent outline-none"
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSave();
                            }
                            if (e.key === "Escape") {
                                handleEditCancel();
                            }
                        }}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleEditCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSubmitting}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            ) : (
                <MessageContent
                    className="bg-accent relative max-w-[70%] rounded-3xl px-5 py-2.5"
                    markdown={false}
                    ref={contentRef}
                >
                    {children}
                </MessageContent>
            )}
            <MessageActions className="flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
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
                            <Check className="size-4" />
                        ) : (
                            <Copy className="size-4" />
                        )}
                    </button>
                </MessageAction>
                <MessageAction
                    tooltip={isEditing ? "Save" : "Edit"}
                    side="bottom"
                    delayDuration={0}
                >
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                        aria-label="Edit"
                        onClick={() => setIsEditing(!isEditing)}
                        type="button"
                    >
                        <Pencil className="size-4" />
                    </button>
                </MessageAction>
                <MessageAction
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
                </MessageAction>
            </MessageActions>
        </MessageContainer>
    );
}
