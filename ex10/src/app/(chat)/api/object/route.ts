// import { Duration } from "@/lib/duration";
// import { getModelClient, LLMModel, LLMModelConfig } from "@/lib/models";
// import { toPrompt } from "@/lib/prompt";
// import ratelimit from "@/lib/ratelimit";
// import { Templates } from "@/lib/templates";
import { schema } from "@/lib/schema";
import { createOpenAI } from "@ai-sdk/openai";
import { CoreMessage, LanguageModel, streamObject } from "ai";

export const maxDuration = 60;

// const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
//     ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
//     : 10;
// const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
//     ? (process.env.RATE_LIMIT_WINDOW as Duration)
//     : "1d";

type LLMModelConfig = {
    model?: string;
    apiKey?: string;
    baseURL?: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    maxTokens?: number;
};

export async function POST(req: Request) {
    const {
        messages,
        userID,
        teamID,
        // template,
        // model,
        // config,
    }: {
        messages: CoreMessage[];
        userID: string | undefined;
        teamID: string | undefined;
        // template: Templates;
        // model: LanguageModel;
        // config: LLMModelConfig;
    } = await req.json();

    // const limit = !config.apiKey
    //     ? await ratelimit(
    //           req.headers.get("x-forwarded-for"),
    //           rateLimitMaxRequests,
    //           ratelimitWindow
    //       )
    //     : false;

    // if (limit) {
    //     return new Response(
    //         "You have reached your request limit for the day.",
    //         {
    //             status: 429,
    //             headers: {
    //                 "X-RateLimit-Limit": limit.amount.toString(),
    //                 "X-RateLimit-Remaining": limit.remaining.toString(),
    //                 "X-RateLimit-Reset": limit.reset.toString(),
    //             },
    //         }
    //     );
    // }

    console.log("userID", userID);
    console.log("teamID", teamID);
    // console.log('template', template)
    // console.log("model", model);
    // console.log('config', config)

    // const {
    //     model: modelNameString,
    //     apiKey: modelApiKey,
    //     ...modelParams
    // } = config;
    // const modelClient = getModelClient(model, config);

    try {
        const stream = streamObject({
            model: createOpenAI()("gpt-4o-mini"),
            schema,
            system: `
                You are an expert browser extension developer with deep knowledge of Chrome Extensions.

                Your task is to create browser extensions following these requirements:
                - Create manifest.json using Manifest V3 spec
                - Create content-script.js for page interactions
                - Think carefully about security and best practices
                - Write production-ready code
                - Exclude comments, icons and images
                - Focus on core functionality only

                Analyze requirements thoroughly before responding.
                Explain your implementation choices clearly.
                Consider (but do not necessarily include) security implications of each decision.

                If the user's request does not require code generation, simply respond to the user. Don't be too brief.
            `,
            messages,
            mode: "auto",
            maxRetries: 0, // do not retry on errors
            // ...modelParams,
        });

        return stream.toTextStreamResponse();
    } catch (error: any) {
        const isRateLimitError =
            error &&
            (error.statusCode === 429 || error.message.includes("limit"));
        const isOverloadedError =
            error && (error.statusCode === 529 || error.statusCode === 503);
        const isAccessDeniedError =
            error && (error.statusCode === 403 || error.statusCode === 401);

        if (isRateLimitError) {
            return new Response(
                "The provider is currently unavailable due to request limit. Try using your own API key.",
                {
                    status: 429,
                }
            );
        }

        if (isOverloadedError) {
            return new Response(
                "The provider is currently unavailable. Please try again later.",
                {
                    status: 529,
                }
            );
        }

        if (isAccessDeniedError) {
            return new Response(
                "Access denied. Please make sure your API key is valid.",
                {
                    status: 403,
                }
            );
        }

        console.error("Error:", error);

        return new Response(
            "An unexpected error has occurred. Please try again later.",
            {
                status: 500,
            }
        );
    }
}
