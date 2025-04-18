import { tool } from "ai";
import { z } from "zod";

export const getPageContext = tool({
    description: "Get the HTML and CSS content of the page",
    parameters: z.object({ sessionId: z.number() }),
    execute: async ({ sessionId }) => {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_XPRA_SERVER_URL}/getSessionDom/${sessionId}`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get page context: ${response.statusText}`
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to retrieve DOM content");
        }

        return data.dom;
    },
});
