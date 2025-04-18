"use client";

import { useEffect, useRef, useState } from "react";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { type FragmentSchema } from "@/lib/schema";
import { generateUUID } from "@/lib/utils";
import { createXpraSession, updateXpraSession } from "@/lib/xpra";
import { useChat } from "@ai-sdk/react";
import { DeepPartial, Message, ToolInvocation, UIMessage } from "ai";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

type ToolInvocationUIPart = {
    type: "tool-invocation";
    /**
     * The tool invocation.
     */
    toolInvocation: ToolInvocation;
};

interface ClientProps {
    id: string;
    initialMessages?: Array<UIMessage>;
}

export function Client({ id, initialMessages }: ClientProps) {
    const [initialInput] = useQueryState("initialInput", { defaultValue: "" });
    const [isPreviewLoading, setIsPreviewLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string>();
    const [currentTab, setCurrentTab] = useState("code");

    const {
        messages,
        setMessages,
        handleSubmit: submit,
        input,
        setInput,
        append,
        status,
        stop,
        reload,
        error,
    } = useChat({
        id,
        body: { id },
        initialInput: !initialMessages?.length ? initialInput : "",
        initialMessages,
        experimental_throttle: 100,
        sendExtraMessageFields: true,
        generateId: generateUUID,
        api: "/api/chat",
        onError: (error) => {
            console.error("Error in chat:", error);
            toast.error("An error occurred: " + error?.message);
        },
        onFinish: async (message) => {
            console.log("onFinish", message);

            // setIsPreviewLoading(true);

            const code = extractCodeFromMessage(message);
            try {
                if (!code) {
                    return;
                }

                if (!sessionId) {
                    toast.error(
                        "Could not send code to xpra. Please try again."
                    );
                    return;
                }

                await Promise.all(
                    code.map((c) =>
                        updateXpraSession(
                            sessionId,
                            c.file_path,
                            c.file_content
                        )
                    )
                );
            } catch (error) {
                console.error("Failed to update Xpra session:", error);
                toast.error("Failed to update code in session");
            }

            setCurrentTab("preview");
            // setIsPreviewLoading(false);
        },
    });

    const xpraSessionCreated = useRef(false);

    const handleSubmit = async () => {
        if (!xpraSessionCreated.current) {
            xpraSessionCreated.current = true;

            createXpraSession()
                .then(({ sessionId }) => {
                    setSessionId(sessionId);
                    console.log("Xpra session created with ID:", sessionId);
                    setIsPreviewLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to create Xpra session:", error);
                    toast.error("Xpra session not created");
                });
        }

        submit();
    };

    const extractCodeFromMessage = (
        message?: Message
    ): FragmentSchema["code"] => {
        return (
            message?.parts
                ?.filter(
                    (part) =>
                        part.type === "tool-invocation" &&
                        part.toolInvocation?.args
                )
                .flatMap((part) => {
                    const args = (part as ToolInvocationUIPart).toolInvocation
                        .args;
                    const code = args.code;
                    return code;
                })
                .filter(Boolean) ?? null
        );
    };

    const [fragment, setFragment] = useState<
        DeepPartial<FragmentSchema>["code"]
    >(() => extractCodeFromMessage(initialMessages?.at(-1)));

    const lastMessage = messages.at(-1);

    useEffect(() => {
        const flattenedArgs = extractCodeFromMessage(lastMessage);

        if (!flattenedArgs?.length) {
            return;
        }

        setFragment(flattenedArgs);
    }, [messages, lastMessage]);

    // ! this is a hack
    const initialRender = useRef(true);
    useEffect(() => {
        if (initialInput && !initialMessages?.length && initialRender.current) {
            handleSubmit();
            initialRender.current = false;
        }
    }, [initialInput, handleSubmit, initialMessages?.length]);

    return (
        <div className="flex flex-row w-full h-full max-h-full gap-4 p-2">
            <Chat
                input={input}
                messages={messages}
                status={status}
                onStop={stop}
                onValueChange={setInput}
                onSubmit={handleSubmit}
                reload={reload}
                setMessages={setMessages}
            />

            <Artifact
                code={fragment}
                isLoading={isPreviewLoading}
                currentPreview={sessionId}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
            />
        </div>
    );
}
