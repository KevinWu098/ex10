import React from "react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { HttpClient } from "@cloudflare/sandbox/client";
import "./style.css";

interface CommandResult {
    id: string;
    command: string;
    args: string[];
    status: "running" | "completed" | "error";
    stdout: string;
    stderr: string;
    exitCode?: number;
    timestamp: Date;
}

function App() {
    const [client, setClient] = useState<HttpClient | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<
        "disconnected" | "connecting" | "connected"
    >("disconnected");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [lastPingTime, setLastPingTime] = useState<number | null>(null);
    const [pingInterval, setPingInterval] = useState<number | null>(null);
    const [commandInput, setCommandInput] = useState("");
    const [results, setResults] = useState<CommandResult[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const resultsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new results are added
    useEffect(() => {
        resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [results]);

    // Initialize HTTP client
    useEffect(() => {
        const httpClient = new HttpClient({
            baseUrl: window.location.origin,
            onCommandComplete: (
                success: boolean,
                exitCode: number,
                stdout: string,
                stderr: string,
                command: string,
                args: string[]
            ) => {
                setResults((prev) => {
                    const updated = [...prev];
                    const lastResult = updated[updated.length - 1];
                    if (lastResult && lastResult.command === command) {
                        lastResult.status = success ? "completed" : "error";
                        lastResult.exitCode = exitCode;
                        lastResult.stdout = stdout;
                        lastResult.stderr = stderr;
                    }
                    return updated;
                });
                setIsExecuting(false);
            },
            onCommandStart: (command: string, args: string[]) => {
                console.log("Command started:", command, args);
                const newResult: CommandResult = {
                    args,
                    command,
                    id: Date.now().toString(),
                    status: "running",
                    stderr: "",
                    stdout: "",
                    timestamp: new Date(),
                };
                setResults((prev) => [...prev, newResult]);
                setIsExecuting(true);
            },
            onError: (error: string, command?: string) => {
                console.error("Command error:", error);
                setResults((prev) => {
                    const updated = [...prev];
                    const lastResult = updated[updated.length - 1];
                    if (lastResult && lastResult.command === command) {
                        lastResult.status = "error";
                        lastResult.stderr += `\nError: ${error}`;
                    }
                    return updated;
                });
                setIsExecuting(false);
            },
            onOutput: (
                stream: "stdout" | "stderr",
                data: string,
                command: string
            ) => {
                setResults((prev) => {
                    const updated = [...prev];
                    const lastResult = updated[updated.length - 1];
                    if (lastResult && lastResult.command === command) {
                        if (stream === "stdout") {
                            lastResult.stdout += data;
                        } else {
                            lastResult.stderr += data;
                        }
                    }
                    return updated;
                });
            },
            onStreamEvent: (event) => {
                console.log("Stream event:", event);
            },
        });

        setClient(httpClient);

        // Initialize connection
        const initializeConnection = async () => {
            try {
                setConnectionStatus("connecting");

                // Test connection with ping
                const startTime = Date.now();
                await httpClient.ping();
                const endTime = Date.now();
                setLastPingTime(endTime - startTime);

                // Create a session
                const session = await httpClient.createSession();
                setSessionId(session);
                setConnectionStatus("connected");
                console.log("Connected with session:", session);
            } catch (error: any) {
                console.error("Failed to connect:", error);
                setConnectionStatus("disconnected");
            }
        };

        initializeConnection();

        // Setup periodic ping
        const interval = setInterval(async () => {
            if (client && connectionStatus === "connected") {
                try {
                    const startTime = Date.now();
                    await httpClient.ping();
                    const endTime = Date.now();
                    setLastPingTime(endTime - startTime);
                } catch (error) {
                    console.error("Ping failed:", error);
                    setConnectionStatus("disconnected");
                }
            }
        }, 5000);

        setPingInterval(interval);

        // Cleanup on unmount
        return () => {
            if (interval) clearInterval(interval);
            if (httpClient) {
                httpClient.clearSession();
            }
        };
    }, []);

    const executeCommand = async () => {
        if (
            !client ||
            connectionStatus !== "connected" ||
            !commandInput.trim() ||
            isExecuting
        ) {
            return;
        }

        const trimmedCommand = commandInput.trim();
        const parts = trimmedCommand.split(" ");
        const command = parts[0];
        const args = parts.slice(1);

        try {
            setIsExecuting(true);

            // Create a result entry for the command
            const newResult: CommandResult = {
                args,
                command,
                id: Date.now().toString(),
                status: "running",
                stderr: "",
                stdout: "",
                timestamp: new Date(),
            };
            setResults((prev) => [...prev, newResult]);

            // Execute the command
            console.log("Executing command:", command, args);
            const result = await client.execute(
                command,
                args,
                sessionId || undefined
            );
            console.log("Result:", result);

            // Update the result with the response
            setResults((prev) => {
                const updated = [...prev];
                const lastResult = updated[updated.length - 1];
                if (lastResult && lastResult.command === command) {
                    lastResult.status = result.success ? "completed" : "error";
                    lastResult.exitCode = result.exitCode;
                    lastResult.stdout = result.stdout;
                    lastResult.stderr = result.stderr;
                }
                return updated;
            });

            setCommandInput("");
        } catch (error: any) {
            console.error("Failed to execute command:", error);
            setResults((prev) => {
                const updated = [...prev];
                const lastResult = updated[updated.length - 1];
                if (lastResult && lastResult.command === command) {
                    lastResult.status = "error";
                    lastResult.stderr += `\nError: ${error.message || error}`;
                }
                return updated;
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const executeStreamingCommand = async () => {
        if (
            !client ||
            connectionStatus !== "connected" ||
            !commandInput.trim() ||
            isExecuting
        ) {
            return;
        }

        const trimmedCommand = commandInput.trim();
        const parts = trimmedCommand.split(" ");
        const command = parts[0];
        const args = parts.slice(1);

        try {
            setIsExecuting(true);

            // Create a result entry for the command
            const newResult: CommandResult = {
                args,
                command,
                id: Date.now().toString(),
                status: "running",
                stderr: "",
                stdout: "",
                timestamp: new Date(),
            };
            setResults((prev) => [...prev, newResult]);

            // Execute the command with streaming
            console.log("Executing streaming command:", command, args);
            await client.executeStream(command, args, sessionId || undefined);
            console.log("Streaming command completed");

            setCommandInput("");
        } catch (error: any) {
            console.error("Failed to execute streaming command:", error);
            setResults((prev) => {
                const updated = [...prev];
                const lastResult = updated[updated.length - 1];
                if (lastResult && lastResult.command === command) {
                    lastResult.status = "error";
                    lastResult.stderr += `\nError: ${error.message || error}`;
                }
                return updated;
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            executeCommand();
        }
    };

    const clearResults = () => {
        setResults([]);
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case "connected":
                return "text-green-500";
            case "connecting":
                return "text-yellow-500";
            case "disconnected":
                return "text-red-500";
            default:
                return "text-gray-500";
        }
    };

    const getStatusIcon = (status: CommandResult["status"]) => {
        switch (status) {
            case "running":
                return "⏳";
            case "completed":
                return "✅";
            case "error":
                return "❌";
            default:
                return "⏳";
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4">
                    Server Connection Test
                </h1>

                <div className="mb-4">
                    <p className="font-semibold">
                        Status:
                        <span className={`ml-2 ${getStatusColor()}`}>
                            {connectionStatus.charAt(0).toUpperCase() +
                                connectionStatus.slice(1)}
                        </span>
                    </p>
                </div>

                {sessionId && (
                    <div className="mb-4">
                        <p className="font-semibold">
                            Session ID:
                            <span className="ml-2 text-blue-500">
                                {sessionId}
                            </span>
                        </p>
                    </div>
                )}

                {lastPingTime !== null && (
                    <div className="mb-4">
                        <p className="font-semibold">
                            Last Ping:
                            <span className="ml-2">{lastPingTime}ms</span>
                        </p>
                    </div>
                )}

                <div className="mt-8 text-sm text-gray-500">
                    <p>
                        The server is automatically pinged every 5 seconds to
                        check connection status.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Create root element
const container = document.getElementById("root");
if (!container) {
    throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
