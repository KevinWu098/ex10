"use client";

// TODO: server component
import { useCallback, useEffect, useState } from "react";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { ObjectMessage } from "@/lib/message";
import {
    isFragmentSchemaCode,
    schema,
    type FragmentSchema,
} from "@/lib/schema";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import { toast } from "sonner";

function formatFileContent(fragment: DeepPartial<FragmentSchema> | undefined) {
    const content = fragment?.code?.at(0)?.file_content;

    // Unescape newline characters
    return content?.includes("\\n") ? content.replace(/\\n/g, "\n") : content;
}

export default function Page() {
    const [messages, setMessages] = useState<ObjectMessage[]>([]);
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
        onFinish: async ({ object, error }) => {
            console.log("hit", error);

            if (!error) {
                return;
            }

            toast.error("An error occurred: " + error?.message);
        },
    });

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

    function setMessage(message: ObjectMessage, index?: number) {
        setMessages((previousMessages) => {
            const updatedMessages = [...previousMessages];
            updatedMessages[index ?? previousMessages.length - 1] = {
                ...previousMessages[index ?? previousMessages.length - 1],
                ...message,
            };

            return updatedMessages;
        });
    }

    function addMessage(message: ObjectMessage) {
        setMessages((previousMessages) => [...previousMessages, message]);
        return [...messages, message];
    }

    useEffect(() => {
        const lastMessage = messages.at(-1);

        if (object) {
            setFragment(object);

            const content: ObjectMessage["content"] = [
                { type: "text", text: object?.commentary || "" },
                {
                    type: "code",
                    code: isFragmentSchemaCode(object?.code) ? object.code : [],
                },
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

    useEffect(() => {
        if (error) {
            stop();
        }
    }, [error]);

    return (
        <div className="flex flex-row w-full h-full max-h-full gap-4 p-2">
            <Chat
                input={input}
                messages={messages}
                isLoading={isLoading}
                onValueChange={setInput}
                onSubmit={handleSubmit}
            />
            <Artifact content={formatFileContent(fragment) || ""} />
        </div>
    );
}
