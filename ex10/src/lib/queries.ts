import "server-only";

import db from "@/db";
import { chat, DBMessage, message } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function getChatById({ id }: { id: string }) {
    try {
        const [selectedChat] = await db
            .select()
            .from(chat)
            .where(eq(chat.id, id));
        return selectedChat;
    } catch (error) {
        console.error("Failed to get chat by id from database");
        throw error;
    }
}

export async function saveChat({
    id,
    // userId,
    title,
}: {
    id: string;
    // userId: string;
    title: string | undefined;
}) {
    try {
        return await db.insert(chat).values({
            id,
            createdAt: new Date(),
            // userId,
            title: title ?? "New Chat",
        });
    } catch (error) {
        console.error("Failed to save chat in database");
        throw error;
    }
}

export async function saveMessages({
    messages,
}: {
    messages: Array<DBMessage>;
}) {
    try {
        return await db.insert(message).values(messages);
    } catch (error) {
        console.error("Failed to save messages in database", error);
        throw error;
    }
}

export async function getMessagesByChatId({ id }: { id: string }) {
    try {
        return await db
            .select()
            .from(message)
            .where(eq(message.chatId, id))
            .orderBy(asc(message.createdAt));
    } catch (error) {
        console.error("Failed to get messages by chat id from database", error);
        throw error;
    }
}

export async function getMessageById({ id }: { id: string }) {
    try {
        return await db.select().from(message).where(eq(message.id, id));
    } catch (error) {
        console.error("Failed to get message by id from database");
        throw error;
    }
}
