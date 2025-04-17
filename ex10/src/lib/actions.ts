"use server";

import { Chat } from "@/db/schema";
import { getChatById, saveChat } from "@/lib/queries";
import { appendChatToLocalStorage } from "@/lib/utils";
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

export async function getChatsById({
    ids,
}: {
    ids: string[];
}): Promise<Chat[]> {
    try {
        const chats = await Promise.all(
            ids.map(async (id) => {
                try {
                    return await getChatById({ id });
                } catch (error) {
                    console.error(`Failed to get chat with id ${id}`);
                    return null;
                }
            })
        );

        return chats.filter((c) => c !== null && c !== undefined);
    } catch (error) {
        console.error("Failed to get chats by ids");
        throw error;
    }
}
