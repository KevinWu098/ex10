"use server";

import { FragmentSchema } from "@/lib/schema";

const XPRA_SERVER_URL = process.env.NEXT_PUBLIC_XPRA_SERVER_URL;

export async function createXpraSession() {
    try {
        const response = await fetch(`${XPRA_SERVER_URL}/createSession`, {
            method: "GET",
            headers: {
                Accept: "text/event-stream",
                "Cache-Control": "no-cache",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to create session: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let sessionId: string | undefined;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split("\n");
            for (const line of lines) {
                if (!line) continue;

                try {
                    const event = JSON.parse(line);
                    console.log("Session event:", event);

                    if (event.status === "complete" && event.data.sessionId) {
                        sessionId = event.data.sessionId;
                    } else if (event.status === "error") {
                        throw new Error(event.data.message);
                    }
                } catch (e) {
                    console.error("Failed to parse event:", e);
                }
            }
        }

        if (!sessionId) {
            throw new Error("No session ID received");
        }

        return { sessionId };
    } catch (error) {
        console.error("Error creating Xpra session:", error);
        throw error;
    }
}

export async function updateXpraSession(
    sessionId: string,
    code: NonNullable<FragmentSchema["code"]>[number]
) {
    try {
        console.log("sending");
        const response = await fetch(`${XPRA_SERVER_URL}/updateCode`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId, code }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.message || `Failed to update code: ${response.statusText}`
            );
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error updating code in session:", error);
        throw error;
    }
}
