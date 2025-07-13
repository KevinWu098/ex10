import { CodeData } from "@/lib/data";
import type { Message, ToolInvocation } from "ai";

type ToolInvocationUIPart = Extract<
    NonNullable<Message["parts"]>[number],
    {
        type: "tool-invocation";
    }
>;

export const extractCodeFromMessage = (
    message?: Message
): Record<string, CodeData["content"]> => {
    const codeParts = (message?.parts?.filter(
        (part) =>
            part.type === "tool-invocation" &&
            part.toolInvocation &&
            part.toolInvocation.state === "result"
    ) ?? []) as ToolInvocationUIPart[];

    return codeParts.reduce(
        (acc, part) => {
            const code = (
                part.toolInvocation as Extract<
                    ToolInvocation,
                    { state: "result" }
                >
            ).result;
            if (code) {
                acc[code.file_path] = code;
            }
            return acc;
        },
        {} as Record<string, CodeData["content"]>
    );
};
