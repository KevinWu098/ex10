import { generateExtension } from "@/app/(chat)/api/chat/generateExtension";
import { getPageContext } from "@/app/(chat)/api/chat/getPageContext";
import { generateTitleFromUserMessage } from "@/lib/actions";
import type { CodeData } from "@/lib/data";
import { getModel } from "@/lib/models";
import { getChatById, saveChat, saveMessages } from "@/lib/queries";
import { SYSTEM_PROMPT } from "@/lib/system";
import { generateUUID, getMostRecentUserMessage } from "@/lib/utils";
import {
    appendResponseMessages,
    createDataStreamResponse,
    smoothStream,
    streamText,
    UIMessage,
} from "ai";

export async function POST(request: Request) {
    try {
        const {
            id,
            messages,
            fragment,
        }: {
            id: string;
            messages: Array<UIMessage>;
            fragment: Record<string, CodeData["content"]>;
        } = await request.json();

        const userMessage = getMostRecentUserMessage(messages);

        if (!userMessage) {
            return new Response("No user message found", { status: 400 });
        }

        const chat = await getChatById({ id });

        if (!chat) {
            const title = await generateTitleFromUserMessage({
                message: userMessage,
            });

            await saveChat({
                id,
                // userId: session.user.id,
                title,
            });
        }

        await saveMessages({
            messages: [
                {
                    chatId: id,
                    id: userMessage.id,
                    role: "user",
                    parts: userMessage.parts,
                    attachments: userMessage.experimental_attachments ?? [],
                    createdAt: new Date(),
                },
            ],
        });

        return createDataStreamResponse({
            execute: (dataStream) => {
                const fragmentContext =
                    Object.keys(fragment).length > 0
                        ? `\n\nCurrent code files:\n${Object.entries(fragment)
                              .map(
                                  ([filePath, content]) =>
                                      `\n--- ${filePath} ---\n${content.file_content || ""}`
                              )
                              .join("\n")}`
                        : "";

                const result = streamText({
                    model: getModel(),
                    system: SYSTEM_PROMPT + fragmentContext,
                    messages,
                    maxSteps: 5,
                    experimental_activeTools: [
                        "generateExtension",
                        // "getPageContext",
                    ],
                    experimental_transform: smoothStream({ chunking: "word" }),
                    experimental_generateMessageId: generateUUID,
                    toolCallStreaming: true,
                    tools: {
                        generateExtension: generateExtension({
                            dataStream,
                        }),
                        // getPageContext,
                    },
                    toolChoice: "auto",
                    onFinish: async ({ response }) => {
                        try {
                            const assistantId = response.messages
                                .filter(
                                    (message) => message.role === "assistant"
                                )
                                .at(-1)?.id;

                            if (!assistantId) {
                                throw new Error("No assistant message found!");
                            }

                            const [, assistantMessage] = appendResponseMessages(
                                {
                                    messages: [userMessage],
                                    responseMessages: response.messages,
                                }
                            );

                            if (!assistantMessage) {
                                throw new Error("No assistant message found!");
                            }

                            await saveMessages({
                                messages: [
                                    {
                                        id: assistantId,
                                        chatId: id,
                                        role: assistantMessage.role,
                                        parts: assistantMessage.parts,
                                        attachments:
                                            assistantMessage.experimental_attachments ??
                                            [],
                                        createdAt: new Date(),
                                    },
                                ],
                            });
                        } catch (_) {
                            console.error("Failed to save chat");
                        }
                    },
                });

                result.consumeStream();

                result.mergeIntoDataStream(dataStream, {
                    sendReasoning: true,
                });
            },
            onError: (e) => {
                console.error(e);
                return "Oops, an error occurred!";
            },
        });
    } catch {
        return new Response(
            "An error occurred while processing your request!",
            {
                status: 404,
            }
        );
    }
}
