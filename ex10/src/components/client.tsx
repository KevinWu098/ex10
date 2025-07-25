"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import {
    extractCodeFromAllMessages,
    extractCodeFromMessage,
} from "@/lib/client";
import { CodeData, CodeDataSchema } from "@/lib/data";
import { generateUUID } from "@/lib/utils";
import {
    createLocalXpraSession,
    getXpraStatus,
    updateLocalXpraSession,
} from "@/lib/xpra-local";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

interface ClientProps {
    id: string;
    initialMessages?: Array<UIMessage>;
}

export function Client({ id, initialMessages }: ClientProps) {
    const [initialInput] = useQueryState("initialInput", { defaultValue: "" });
    const [isPreviewLoading, setIsPreviewLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string>();
    const [currentTab, setCurrentTab] = useState("code");

    const initialCode = useMemo(
        () => extractCodeFromAllMessages(initialMessages),
        [initialMessages]
    );
    const [currentFile, setCurrentFile] = useState<string>(
        Object.keys(initialCode).at(0) ?? ""
    );
    const [fragment, setFragment] =
        useState<Record<string, CodeData["content"]>>(initialCode);

    const {
        messages,
        setMessages,
        handleSubmit,
        input,
        setInput,
        append: _append,
        status,
        stop,
        reload,
        error: _error,
        data,
    } = useChat({
        id,
        body: { id, fragment },
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
            const code = extractCodeFromMessage(message);
            setFragment((prev) => ({
                ...prev,
                ...code,
            }));

            let session = sessionId;
            try {
                if (!code) {
                    return;
                }

                try {
                    const res = await getXpraStatus();

                    if (!session && !res.running) {
                        toast.info(
                            "Environment not yet initialized... connection currently in progress"
                        );
                        try {
                            await createLocalXpraSession();
                            session = "foo";
                            setSessionId("foo");
                        } catch (error) {
                            console.error(
                                "Failed to create Xpra session:",
                                error
                            );
                            toast.error("Xpra session not created");
                        }
                    }

                    if (!session && !res.running) {
                        toast.error("No session ID found");
                        throw new Error("No session ID found");
                    }
                } catch (error) {
                    console.error("Failed to get Xpra status:", error);
                    toast.error("Failed to get Xpra status");
                    throw error;
                }

                const codeFiles = Object.values(code);
                await Promise.all(
                    codeFiles.map((codeFile) => {
                        if (!codeFile) return Promise.resolve();

                        return updateLocalXpraSession(
                            session as string,
                            codeFile
                        );
                    })
                );
            } catch (error) {
                console.error(
                    "Failed to communicate with Xpra session:",
                    error
                );
                toast.error("Failed to communicate with Xpra session");
            }

            setIsPreviewLoading(false);
        },
    });

    useEffect(() => {
        if (!data) {
            return;
        }

        const result = CodeDataSchema.safeParse(data.at(-1));
        if (!result.success) {
            return;
        }
        const safeData = result.data;

        const { file_path: filePath, file_path_finished: filePathFinished } =
            safeData.content;
        if (!filePath || !filePathFinished) {
            return;
        }
        if (!currentFile) {
            setCurrentFile(filePath);
        }

        setFragment((prev) => ({
            ...prev,
            [filePath]: safeData.content,
        }));
    }, [data]);

    // ! this is a hack
    const initialRender = useRef(true);
    useEffect(() => {
        if (initialInput && !initialMessages?.length && initialRender.current) {
            handleSubmit();
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.delete("initialInput");
            const newUrl = `${window.location.pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
            window.history.replaceState({}, "", newUrl);
            initialRender.current = false;
        }
    }, [initialInput, handleSubmit, initialMessages?.length]);

    return (
        <div className="flex h-full max-h-full w-full flex-row gap-4 p-2">
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
                fragment={fragment}
                isLoading={isPreviewLoading}
                currentPreview={sessionId}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                currentFile={currentFile}
                setCurrentFile={setCurrentFile}
            />
        </div>
    );
}
