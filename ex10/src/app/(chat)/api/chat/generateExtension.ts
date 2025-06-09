import { FragmentSchema, schema } from "@/lib/schema";
import { SYSTEM_PROMPT } from "@/lib/system";
import { openai } from "@ai-sdk/openai";
import { DataStreamWriter, streamObject, tool } from "ai";
import { z } from "zod";

export const generateExtension = ({
    dataStream,
}: {
    dataStream: DataStreamWriter;
}) =>
    tool({
        description: `Create/edit files in a multi-file browser extension. Make sure to stick to the schema.`,
        parameters: z.object({
            description: z.string(),
        }),
        execute: async ({ description }) => {
            let draftCode: Partial<FragmentSchema["code"]> | null = null;

            const { fullStream } = streamObject({
                model: openai("gpt-4o-mini"),
                schema,
                prompt: description,
                system: SYSTEM_PROMPT,
            });

            dataStream.writeData({
                type: "code-delta-start",
                content: draftCode,
            });

            for await (const delta of fullStream) {
                const { type } = delta;

                if (type === "object") {
                    const { object } = delta;
                    const { code } = object;

                    if (code) {
                        dataStream.writeData({
                            type: "code-delta",
                            content: code,
                        });

                        draftCode = code;
                    }
                }
            }

            dataStream.writeData({
                type: "code-delta",
                content: draftCode,
            });

            return draftCode;
        },
    });
