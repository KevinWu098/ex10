"use server";

import db from "@/db";
import { Chat, message } from "@/db/schema";
import { getModel } from "@/lib/models";
import { getChatById, getMessageById, saveChat } from "@/lib/queries";
import { generateText, Message } from "ai";
import { and, eq, gte, inArray } from "drizzle-orm";

export async function generateTitleFromUserMessage({
    message,
}: {
    message: Message;
}) {
    const { text: title } = await generateText({
        model: getModel(),
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
                } catch {
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

export async function deleteTrailingMessages({ id }: { id: string }) {
    const [message] = await getMessageById({ id });

    if (!message) {
        return;
    }

    await deleteMessagesByChatIdAfterTimestamp({
        chatId: message.chatId,
        timestamp: message.createdAt,
    });
}

export async function deleteMessagesByChatIdAfterTimestamp({
    chatId,
    timestamp,
}: {
    chatId: string;
    timestamp: Date;
}) {
    try {
        const messagesToDelete = await db
            .select({ id: message.id })
            .from(message)
            .where(
                and(
                    eq(message.chatId, chatId),
                    gte(message.createdAt, timestamp)
                )
            );

        const messageIds = messagesToDelete.map((message) => message.id);

        if (messageIds.length > 0) {
            return await db
                .delete(message)
                .where(
                    and(
                        eq(message.chatId, chatId),
                        inArray(message.id, messageIds)
                    )
                );
        }
    } catch (error) {
        console.error(
            "Failed to delete messages by id after timestamp from database"
        );
        throw error;
    }
}
