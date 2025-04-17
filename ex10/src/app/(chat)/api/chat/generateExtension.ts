import { schema } from "@/lib/schema";
import { tool } from "ai";

export const generateExtension = () =>
    tool({
        description: `Create/edit files in a multi-file browser extension. Make sure to stick to the schema.`,
        parameters: schema,
        execute: async () => {
            return {
                content: "completed",
            };
        },
    });
