"use client";

import { useEffect, useRef, useState } from "react";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { CodeData, CodeDataSchema } from "@/lib/data";
import { generateUUID } from "@/lib/utils";
import { createXpraSession, updateXpraSession } from "@/lib/xpra";
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
            console.log("onFinish", message);

            setFragment(extractCodeFromMessage(message));

            return;
            let session = sessionId;
            try {
                if (!fragment) {
                    return;
                }

                if (!session) {
                    toast.info(
                        "Xpra server not yet initialized... connection currently in progress"
                    );
                    setCurrentTab("preview");

                    try {
                        const { sessionId: newSessionId } =
                            await createXpraSession();
                        session = newSessionId;
                        setSessionId(newSessionId);
                    } catch (error) {
                        console.error("Failed to create Xpra session:", error);
                        toast.error("Xpra session not created");
                        throw error; // propagate upwards
                    }
                }

                if (!session) {
                    toast.error("No session ID found");
                    throw new Error("No session ID found");
                }

                setCurrentTab("preview");
                // await Promise.all(
                //     code.map((c) => {
                //         const cleanedContent = formatFileContent(
                //             code,
                //             c.file_name
                //         );

                //         console.log("cleaned content", cleanedContent);

                //         return updateXpraSession(session as string, {
                //             ...c,
                //             file_content: cleanedContent ?? "",
                //         });
                //     })
                // );

                setIsPreviewLoading(false);
            } catch (error) {
                console.error(
                    "Failed to communicate with Xpra session:",
                    error
                );
                toast.error("Failed to communicate with Xpra session");
            }

            setCurrentTab("preview");
            // setIsPreviewLoading(false);
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

        console.log("data", data);

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
