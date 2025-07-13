"use server";

import { FragmentSchema } from "@/lib/schema";

const XPRA_SERVER_URL = process.env.NEXT_PUBLIC_LOCAL_XPRA_SERVER_URL;

export async function createLocalXpraSession(port?: number) {
    try {
        const response = await fetch(`${XPRA_SERVER_URL}/xpra/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.error ||
                    `Failed to create session: ${response.statusText}`
            );
        }

        const result = await response.json();
        console.log("Xpra session started:", result);

        return {
            message: result.message,
            port: result.port,
        };
    } catch (error) {
        console.error("Error creating Xpra session:", error);
        throw error;
    }
}

export async function stopLocalXpraSession() {
    try {
        const response = await fetch(`${XPRA_SERVER_URL}/xpra/stop`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.error || `Failed to stop session: ${response.statusText}`
            );
        }

        const result = await response.json();
        console.log("Xpra session stopped:", result);

        return result;
    } catch (error) {
        console.error("Error stopping Xpra session:", error);
        throw error;
    }
}

export async function getXpraStatus() {
    try {
        const response = await fetch(`${XPRA_SERVER_URL}/xpra/status`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get status: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Xpra status:", result);

        return {
            running: result.running,
            managedByServer: result.managedByServer,
            port: result.port,
        };
    } catch (error) {
        console.error("Error getting Xpra status:", error);
        throw error;
    }
}

export async function getServerHealth() {
    try {
        const response = await fetch(`${XPRA_SERVER_URL}/health`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Server health:", result);

        return result;
    } catch (error) {
        console.error("Error checking server health:", error);
        throw error;
    }
}

export async function updateLocalXpraSession(
    sessionId: string,
    code: FragmentSchema["code"]
) {
    try {
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
