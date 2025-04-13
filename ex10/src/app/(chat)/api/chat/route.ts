import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: openai("gpt-4o-mini"),
        messages,
        abortSignal: req.signal,
        system: `
            You are an expert browser extension developer with deep knowledge of Chrome Extensions.

            Your task is to create browser extensions following these requirements:
            - Create manifest.json using Manifest V3 spec
            - Create content-script.js for page interactions
            - Think carefully about security and best practices
            - Write minimal, production-ready code
            - Exclude comments, icons and images
            - Focus on core functionality only

            Analyze requirements thoroughly before responding.
            Consider security implications of each decision.
            Do not overly speak.
        `,
    });

    return result.toDataStreamResponse();
}
