// import { Duration } from "@/lib/duration";
// import { getModelClient, LLMModel, LLMModelConfig } from "@/lib/models";
// import { toPrompt } from "@/lib/prompt";
// import ratelimit from "@/lib/ratelimit";
// import { Templates } from "@/lib/templates";
import { getModel } from "@/lib/models";
import { schema } from "@/lib/schema";
import { SYSTEM_PROMPT } from "@/lib/system";
import { CoreMessage, streamObject } from "ai";

export const maxDuration = 60;

// const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
//     ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
//     : 10;
// const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
//     ? (process.env.RATE_LIMIT_WINDOW as Duration)
//     : "1d";

export async function POST(req: Request) {
    const {
        messages,
    }: {
        messages: CoreMessage[];
    } = await req.json();

    try {
        const stream = streamObject({
            model: getModel(),
            schema,
            system: SYSTEM_PROMPT,
            messages,
            mode: "tool",
            maxRetries: 0, // do not retry on errors
            // ...modelParams,
        });

        return stream.toTextStreamResponse();
    } catch (error: unknown) {
        console.error("Error:", error);

        return new Response(
            "An unexpected error has occurred. Please try again later.",
            {
                status: 500,
            }
        );
    }
}
