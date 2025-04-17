"use client";

import { useState } from "react";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { type FragmentSchema } from "@/lib/schema";
import { generateUUID } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import { parseAsBoolean, useQueryState } from "nuqs";
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

interface ClientProps {
    id: string;
}

export function Client({ id }: ClientProps) {
    const [suggestion] = useQueryState("suggestion", { defaultValue: "" });
    const [run] = useQueryState("run", parseAsBoolean.withDefault(false));

    const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>();

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
    } = useChat({
        id,
        initialInput: suggestion,
        experimental_throttle: 100,
        sendExtraMessageFields: true,
        generateId: generateUUID,
        api: "/api/chat",
        onError: (error) => {
            console.error("Error in chat:", error);
            toast.error("An error occurred: " + error?.message);
        },
        onFinish: (message) => {
            console.log("onFinish", message);
        },
    });

    return (
        <div className="flex h-full max-h-full w-full flex-row gap-4 p-2">
            <Chat
                input={input}
                messages={messages}
                status={status}
                onStop={stop}
                onValueChange={setInput}
                onSubmit={handleSubmit}
            />

            <Artifact fragment={fragment} />
        </div>
    );
}
