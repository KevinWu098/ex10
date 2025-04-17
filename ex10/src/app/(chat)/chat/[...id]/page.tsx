"use client";

// TODO: server component
import { useCallback, useEffect, useRef, useState } from "react";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { ObjectMessage, toAISDKMessages } from "@/lib/message";
import {
    isFragmentSchemaCode,
    schema,
    type FragmentSchema,
} from "@/lib/schema";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";

const example: DeepPartial<FragmentSchema> = {
    commentary:
        "I will create a simple example of a Chrome extension that changes the background color of a webpage. This will include a manifest file and a content script. The manifest will be structured according to Manifest V3 specifications, and the content script will handle the interaction with the webpage. I'll ensure to follow best practices for security and functionality.",
    title: "Background Color Changer",
    code: [
        {
            file_name: "manifest.json",
            file_path: "manifest.json",
            file_content:
                '{\\n  "manifest_version": 3,\\n  "name": "Background Color Changer",\\n  "version": "1.0",\\n  "description": "A simple extension to change the background color of a webpage.",\\n  "permissions": [],\\n  "background": {\\n    "service_worker": "background.js"\\n  },\\n  "content_scripts": [\\n    {\\n      "matches": ["<all_urls>"],\\n      "js": ["content-script.js"]\\n    }\\n  ]\\n}',
            file_finished: true,
        },
        {
            file_name: "content-script.js",
            file_path: "content-script.js",
            file_content: "document.body.style.backgroundColor = 'lightblue';",
            file_finished: true,
        },
    ],
};

export default function Page() {
    const [input, setInput] = useQueryState("suggestion", {
        defaultValue: "",
    });
    const [run] = useQueryState("run", parseAsBoolean);

    const [messages, setMessages] = useState<ObjectMessage[]>([]);
    const [_errorMessage, setErrorMessage] = useState("");
    const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>();

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
            console.log("onFinish", { object, error });

            if (!error) {
                return;
            }

            toast.error("An error occurred: " + error?.message);
        },
    });

    const addMessage = useCallback((message: ObjectMessage): void => {
        setMessages((previousMessages) => [...previousMessages, message]);
    }, []);

    const handleSubmit = useCallback(() => {
        addMessage({
            role: "user",
            content: [{ type: "text", text: input }],
        });

        submit({
            userID: "123",
            messages: toAISDKMessages([
                ...messages,
                { role: "user", content: [{ type: "text", text: input }] },
            ]),
        });

        setInput("");
    }, [addMessage, messages, input, submit]);

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

    useEffect(() => {
        const lastMessage = messages.at(-1);

        if (object) {
            if (object.code) {
                // only update the fragment if the object contains code
                setFragment(object);
            }

            const content: ObjectMessage["content"] = [
                { type: "text", text: object?.commentary || "" },
                isFragmentSchemaCode(object?.code)
                    ? { type: "code", code: object.code }
                    : {
                          type: "text",
                          text:
                              object.commentary ??
                              "[ERROR]: No output generated",
                      },
            ];

            if (!lastMessage || lastMessage.role !== "assistant") {
                addMessage({
                    role: "assistant",
                    content,
                    object,
                });

                return;
            }

            if (lastMessage && lastMessage.role === "assistant") {
                setMessage({
                    role: "assistant",
                    content,
                    object,
                });

                return;
            }
        }

        // NB: lastMessage should not trigger a re-render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [object, addMessage]);

    useEffect(() => {
        if (error) {
            stop();
        }
    }, [error, stop]);

    // ! this is a hack
    const hasRun = useRef(false);
    useEffect(() => {
        if (input && run && !hasRun.current) {
            hasRun.current = true;
            handleSubmit();
        }
    }, [input, handleSubmit]);

    return (
        <div className="flex h-full max-h-full w-full flex-row gap-4 p-2">
            <Chat
                input={input}
                messages={messages}
                isLoading={isLoading}
                onStop={stop}
                onValueChange={setInput}
                onSubmit={handleSubmit}
            />

            <Artifact fragment={fragment} />
        </div>
    );
}
