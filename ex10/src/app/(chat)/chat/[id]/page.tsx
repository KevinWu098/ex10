import { notFound } from "next/navigation";
import { Client } from "@/components/client";
import { DBMessage } from "@/db/schema";
import { getChatById, getMessagesByChatId } from "@/lib/queries";
import { Attachment, UIMessage } from "ai";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const chat = await getChatById({ id });

    if (!chat) {
        notFound();
    }

    const messagesFromDb = await getMessagesByChatId({
        id,
    });

    function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
        return messages.map((message) => ({
            id: message.id,
            parts: message.parts as UIMessage["parts"],
            role: message.role as UIMessage["role"],
            // Note: content will soon be deprecated in @ai-sdk/react
            content: "",
            createdAt: message.createdAt,
            experimental_attachments:
                (message.attachments as Array<Attachment>) ?? [],
        }));
    }

    return (
        <Client
            id={chat.id}
            initialMessages={convertToUIMessages(messagesFromDb)}
        />
    );
}
