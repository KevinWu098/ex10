import { InferSelectModel } from "drizzle-orm";
import {
    json,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull().default("New Chat"),
    // userId: uuid("userId")
    //     .notNull()
    //     .references(() => user.id),
    visibility: varchar("visibility", { enum: ["public", "private"] })
        .notNull()
        .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        .references(() => chat.id),
    role: varchar("role").notNull(),
    parts: json("parts").notNull(),
    attachments: json("attachments").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;
