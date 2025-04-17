"use server";

import { saveChat } from "@/lib/queries";
import { openai } from "@ai-sdk/openai";
import { generateText, Message } from "ai";

export async function generateTitleFromUserMessage({
    message,
}: {
    message: Message;
}) {
    const { text: title } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
        prompt: JSON.stringify(message),
    });

    return title;
}

export async function createChat({ id, title }: { id: string; title: string }) {
    await saveChat({
        id,
        title,
    });
}
