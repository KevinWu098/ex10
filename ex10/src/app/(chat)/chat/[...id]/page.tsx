"use client";

// TODO: server component
import { useCallback, useEffect, useState } from "react";
import { schema, type FragmentSchema } from "@/app/(chat)/api/object/schema";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import { toast } from "sonner";

export type MessageText = {
    type: "text";
    text: string;
};

export type MessageCode = {
    type: "code";
    text: string;
};

export type MessageImage = {
    type: "image";
    image: string;
};

export type Message = {
    role: "assistant" | "user";
    content: Array<MessageText | MessageCode | MessageImage>;
    object?: DeepPartial<FragmentSchema>;
};

export default function Page() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>();
    const [input, setInput] = useState("");

    const { object, submit, isLoading, stop, error } = useObject({
        api: "/api/object",
        schema,
        onError: (error) => {
            console.error("Error submitting request:", error);
            // if (error.message.includes("limit")) {
            //     setIsRateLimited(true);
            // }

            setErrorMessage(error.message);
        },
        onFinish: async ({ object: fragment, error }) => {
            console.log("hit", error);

            if (!error) {
                // send it to /api/sandbox
                console.log("fragment", fragment);
                // setIsPreviewLoading(true);
                // posthog.capture("fragment_generated", {
                //     template: fragment?.template,
                // });

                // const response = await fetch("/api/sandbox", {
                //     method: "POST",
                //     body: JSON.stringify({
                //         fragment,
                //         userID: session?.user?.id,
                //         teamID: userTeam?.id,
                //         accessToken: session?.access_token,
                //     }),
                // });

                // const result = await response.json();
                // console.log("result", result);
                // posthog.capture("sandbox_created", { url: result.url });

                // setResult(result);
                // setCurrentPreview({ fragment, result });
                // setMessage({ result });
                // setCurrentTab("fragment");
                // setIsPreviewLoading(false);

                return;
            }

            toast.error("An error occurred: " + error?.message);
        },
    });

    function setMessage(message: Message, index?: number) {
        setMessages((previousMessages) => {
            const updatedMessages = [...previousMessages];
            updatedMessages[index ?? previousMessages.length - 1] = {
                ...previousMessages[index ?? previousMessages.length - 1],
                ...message,
            };

            return updatedMessages;
        });
    }

    const lastMessage = messages.at(-1);

    function addMessage(message: Message) {
        setMessages((previousMessages) => [...previousMessages, message]);
        return [...messages, message];
    }

    useEffect(() => {
        if (object) {
            setFragment(object);
            const content: Message["content"] = [
                { type: "text", text: object.commentary || "" },
                { type: "code", text: object.code || "" },
            ];

            if (!lastMessage || lastMessage.role !== "assistant") {
                addMessage({
                    role: "assistant",
                    content,
                    object,
                });
            }

            if (lastMessage && lastMessage.role === "assistant") {
                setMessage({
                    role: "assistant",
                    content,
                    object,
                });
            }
        }
    }, [object]);

    const content = fragment?.code?.at(0)?.file_content;

    // Unescape newline characters
    const formattedContent = content?.includes("\\n")
        ? content.replace(/\\n/g, "\n")
        : content;

    const handleSubmit = useCallback(() => {
        addMessage({
            role: "user",
            content: [{ type: "text", text: input }],
        });

        submit({
            userID: "123",
            messages: [...messages, { role: "user", content: input }],
        });

        setInput("");
    }, [messages, input, submit]);

    return (
        <div className="flex flex-row w-full h-full max-h-full gap-4 p-2">
            <Chat
                input={input}
                messages={messages}
                isLoading={isLoading}
                onValueChange={setInput}
                onSubmit={handleSubmit}
            />
            <Artifact content={formattedContent || "ff"} />
        </div>
    );
}
