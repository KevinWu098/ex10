import type { FragmentSchema } from "@/lib/schema";
import type { CoreMessage, DeepPartial } from "ai";

type MessageText = {
    type: "text";
    text: string;
};

type MessageCode = {
    type: "code";
    code: FragmentSchema["code"];
};

export type ObjectMessage = {
    role: "assistant" | "user";
    content: Array<MessageText | MessageCode>;
    object?: DeepPartial<FragmentSchema>;
};

export function toAISDKMessages(messages: ObjectMessage[]): CoreMessage[] {
    return messages.map((message) => {
        const content = message.content
            .map((content) => {
                if (content.type === "code") {
                    return content.code;
                }
                return content.text;
            })
            .join("\n");

        return {
            role: message.role,
            content,
        };
    });
}
