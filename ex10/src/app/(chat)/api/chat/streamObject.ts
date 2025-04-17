import { schema } from "@/lib/schema";
import { SYSTEM_PROMPT } from "@/lib/system";
import { createOpenAI } from "@ai-sdk/openai";
import { DataStreamWriter, streamObject, tool } from "ai";
import { z } from "zod";

interface StreamObjectProps {
    dataStream: DataStreamWriter;
}

export const generateExtension = () =>
    tool({
        description:
            `Create/edit files in a multi-file browser extension. Make sure to stick to the schema.`,
        parameters: schema,
        execute: async ({ code, commentary, title, code: codeArray }) => {
            return {
                content: "completed",
            };
        },
    });
