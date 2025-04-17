import { schema } from "@/lib/schema";
import { SYSTEM_PROMPT } from "@/lib/system";
import { createOpenAI } from "@ai-sdk/openai";
import { DataStreamWriter, streamObject, tool } from "ai";
import { z } from "zod";

interface StreamObjectProps {
    dataStream: DataStreamWriter;
}

export const generateExtension = ({ dataStream }: StreamObjectProps) =>
    tool({
        description:
            "Generate a multi-file extension as the response based on the schema. This tool will generate an extension following the defined schema structure.",
        parameters: z.object({
            prompt: z.string(),
        }),
        execute: async ({ prompt }) => {
            const stream = streamObject({
                model: createOpenAI()("gpt-4o-mini"),
                schema,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: prompt }],
                mode: "tool",
                maxRetries: 0,
            });

            for await (const chunk of stream.fullStream) {
                dataStream.writeData({
                    type: "object",
                    content: chunk,
                });
            }

            dataStream.writeData({ type: "finish", content: "" });

            return {
                content: "Object response has been streamed to the user.",
            };
        },
    });
