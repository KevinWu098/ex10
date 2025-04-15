import type { FragmentSchema } from "@/lib/schema";
import type { DeepPartial } from "ai";

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
