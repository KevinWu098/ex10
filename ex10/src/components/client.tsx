"use client";

import { useEffect, useRef, useState } from "react";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { CodeData, CodeDataSchema } from "@/lib/data";
import { generateUUID } from "@/lib/utils";
import { createXpraSession, updateXpraSession } from "@/lib/xpra";
import {
    createLocalXpraSession,
    getXpraStatus,
    updateXpraSession as updateLocalXpraSession,
} from "@/lib/xpra-local";
import { useChat } from "@ai-sdk/react";
import { Message, ToolInvocation, UIMessage } from "ai";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

type ToolInvocationUIPart = Extract<
    NonNullable<Message["parts"]>[number],
    {
        type: "tool-invocation";
    }
>;

interface ClientProps {
    id: string;
    initialMessages?: Array<UIMessage>;
}

const extractCodeFromMessage = (
    message?: Message
): Record<string, CodeData["content"]> => {
    const codeParts = (message?.parts?.filter(
        (part) =>
            part.type === "tool-invocation" &&
            part.toolInvocation &&
            part.toolInvocation.state === "result"
    ) ?? []) as ToolInvocationUIPart[];

    return codeParts.reduce(
        (acc, part) => {
            const code = (
                part.toolInvocation as Extract<
                    ToolInvocation,
                    { state: "result" }
                >
            ).result;
            if (code) {
                acc[code.file_path] = code;
            }
            return acc;
        },
        {} as Record<string, CodeData["content"]>
    );
};

export function Client({ id, initialMessages }: ClientProps) {
    const [initialInput] = useQueryState("initialInput", { defaultValue: "" });
    const [isPreviewLoading, setIsPreviewLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string>();
    const [currentTab, setCurrentTab] = useState("code");
    const [currentFile, setCurrentFile] = useState<string>("");

    const {
        messages,
        setMessages,
        handleSubmit,
        input,
        setInput,
        append,
        status,
        stop,
        reload,
        error,
        data,
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
            const code = extractCodeFromMessage(message);
            setFragment(code);

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
                            // throw error; // propagate upwards
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

                setCurrentTab("preview");

                console.log("code", code);
                // Send all files to the server
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

            setCurrentTab("preview");
            setIsPreviewLoading(false);
        },
    });

    const [fragment, setFragment] = useState<
        Record<string, CodeData["content"]>
    >({});

    useEffect(() => {
        const code = extractCodeFromMessage(initialMessages?.at(-1));
        setFragment(code);
        setCurrentFile(Object.keys(code).at(0) ?? "");
    }, []);

    useEffect(() => {
        if (!data) {
            return;
        }

        if (data.length >= 3) {
            const lastFive = data.slice(-3);
            const allEqual = lastFive.every(
                (item, i, arr) =>
                    i === 0 || JSON.stringify(item) === JSON.stringify(arr[0])
            );

            if (allEqual) {
                stop();
                return;
            }
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

        setCurrentFile(filePath);
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
