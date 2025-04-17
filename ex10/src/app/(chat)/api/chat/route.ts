import { getPageContext } from "@/app/(chat)/api/chat/getPageContext";
import { generateExtension } from "@/app/(chat)/api/chat/streamObject";
import { SYSTEM_PROMPT } from "@/lib/system";
import { generateUUID, getMostRecentUserMessage } from "@/lib/utils";
import { openai } from "@ai-sdk/openai";
import {
    createDataStreamResponse,
    smoothStream,
    streamText,
    UIMessage,
} from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
    try {
        const {
            messages,
        }: {
            messages: Array<UIMessage>;
        } = await request.json();

        const userMessage = getMostRecentUserMessage(messages);

        if (!userMessage) {
            return new Response("No user message found", { status: 400 });
        }

        console.log("server", messages);

        // TODO: DB

        // TODO: Generate Title

        return createDataStreamResponse({
            execute: (dataStream) => {
                const result = streamText({
                    model: openai("gpt-4o-mini"),
                    system: SYSTEM_PROMPT,
                    messages,
                    maxSteps: 5,
                    experimental_activeTools: [
                        "generateExtension",
                        "getPageContext",
                    ],
                    experimental_transform: smoothStream({ chunking: "word" }),
                    experimental_generateMessageId: generateUUID,
                    tools: {
                        generateExtension: generateExtension({ dataStream }),
                        getPageContext,
                    },
                });

                result.consumeStream();

                result.mergeIntoDataStream(dataStream, {
                    sendReasoning: true,
                });
            },
            onError: () => {
                return "Oops, an error occurred!";
            },
        });
    } catch (error) {
        return new Response(
            "An error occurred while processing your request!",
            {
                status: 404,
            }
        );
    }
}
