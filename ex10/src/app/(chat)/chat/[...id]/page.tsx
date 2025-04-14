"use client";

// TODO: server component
import { useState } from "react";
import { schema } from "@/app/(chat)/api/object/schema";
import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";
import { Message, experimental_useObject as useObject } from "@ai-sdk/react";

export default function Page() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [errorMessage, setErrorMessage] = useState("");

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
            }
        },
    });

    console.log(object);
    console.log(object?.code?.at(0)?.file_content);

    const content = object?.code?.at(0)?.file_content;

    // Unescape newline characters
    const formattedContent = content?.includes("\\n")
        ? content.replace(/\\n/g, "\n")
        : content;

    return (
        <div className="flex h-full max-h-full w-full flex-row gap-4 p-2">
            <button
                onClick={() =>
                    submit({
                        userID: "123",
                        messages: [
                            {
                                role: "user",
                                content:
                                    "Create a browser extension that makes github links open in a new tab when looking at issues or pull requests",
                            },
                        ],
                    })
                }
                className="absolute right-4 bottom-4 z-10 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                disabled={isLoading}
            >
                {isLoading ? "Generating..." : "Generate Code"}
            </button>

            <Chat />
            <Artifact content={formattedContent || "ff"} />
        </div>
    );
}
