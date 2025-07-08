"use client";

import { memo, useEffect, useState } from "react";
import { ArtifactCode } from "@/components/artifact/artifact-code";
import { ArtifactFileNames } from "@/components/artifact/artifact-file-names";
import { DownloadZip } from "@/components/chat/download-zip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeData } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
    createLocalXpraSession,
    getServerHealth,
    getXpraStatus,
} from "@/lib/xpra-local";
import { AlertTriangle, Loader2 } from "lucide-react";

export function formatFileContent(
    code: CodeData["content"][],
    currentFile: string
): string | undefined {
    const content = code?.find(
        (c) => c?.file_name === currentFile
    )?.file_content;

    // Unescape newline characters
    return content?.includes("\\n") ? content.replace(/\\n/g, "\n") : content;
}

interface ArtifactProps {
    fragment: Record<string, CodeData["content"]>;
    isLoading: boolean;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    currentPreview: string | undefined;
    currentFile: string;
    setCurrentFile: (file: string) => void;
}

export const Artifact = memo(
    ({
        fragment,
        isLoading,
        currentTab,
        setCurrentTab,
        currentPreview,
        currentFile,
        setCurrentFile,
    }: ArtifactProps) => {
        const code = Object.values(fragment);
        const content = formatFileContent(code, currentFile);
        const [serverIsLive, setServerIsLive] = useState<boolean | null>(null);
        const [isStartingServer, setIsStartingServer] = useState(false);

        // Simple check when preview tab is active
        useEffect(() => {
            if (currentTab === "preview") {
                const checkServer = async () => {
                    try {
                        const xpraStatus = await getXpraStatus();
                        setServerIsLive(xpraStatus.running);
                    } catch (error) {
                        setServerIsLive(false);
                    }
                };
                checkServer();
            }
        }, [currentTab, isLoading, currentPreview, currentPreview]);

        const handleStartServer = async () => {
            setIsStartingServer(true);
            try {
                await createLocalXpraSession();
                // Wait a moment then recheck server status
                setTimeout(async () => {
                    try {
                        const xpraStatus = await getXpraStatus();
                        setServerIsLive(xpraStatus.running);
                    } catch (error) {
                        setServerIsLive(false);
                    }
                }, 2000);
            } catch (error) {
                console.error("Failed to start server:", error);
            } finally {
                setIsStartingServer(false);
            }
        };

        if (!code.length) {
            return null;
        }

        return (
            <Tabs
                defaultValue="code"
                className="overflow-hidden gap-0 grow"
                value={currentTab}
                onValueChange={setCurrentTab}
            >
                <div className="flex justify-between p-2 mb-2 rounded-sm border border-input shadow-xs">
                    <TabsList className="rounded-sm">
                        <TabsTrigger
                            value="code"
                            className="rounded-xs py-0 data-[state=active]:shadow-xs"
                        >
                            Code
                        </TabsTrigger>
                        <TabsTrigger
                            value="preview"
                            className="rounded-xs py-0 data-[state=active]:shadow-xs"
                        >
                            Preview
                        </TabsTrigger>
                    </TabsList>

                    <DownloadZip
                        extensionName={undefined} // TODO: pass in the extension name
                        code={code}
                    />
                </div>

                <div
                    className={cn(
                        "border-input shrink-0 gap-2 overflow-x-auto rounded-t-sm border border-b-0 p-2",
                        currentTab === "code" && !!code.length
                            ? "flex"
                            : "hidden"
                    )}
                >
                    <ArtifactFileNames
                        code={code}
                        currentFile={currentFile}
                        setCurrentFile={setCurrentFile}
                    />

                    {/* TODO: add copy button and download button */}
                </div>

                <div
                    className={cn(
                        "border-input h-full overflow-auto rounded-b-sm border shadow-xs",
                        currentTab === "code" && !!code.length
                            ? "rounded-b-sm"
                            : "rounded-sm"
                    )}
                >
                    <TabsContent
                        value="code"
                        forceMount // NB: forceMount prevents the code editor from being unmounted
                        className={cn(
                            "flex",
                            currentTab === "preview" ? "h-0" : "h-full"
                        )}
                    >
                        <ArtifactCode
                            value={currentTab}
                            content={content}
                        />
                    </TabsContent>

                    <TabsContent
                        value="preview"
                        className={cn(
                            "flex h-full",
                            currentTab === "code" ? "hidden" : ""
                        )}
                        forceMount // NB: forceMount prevents the preview from being unmounted
                    >
                        {code.length > 0 && serverIsLive === true ? (
                            <iframe
                                className="w-full h-full border-0"
                                title="Preview"
                                src={`${process.env.NEXT_PUBLIC_LOCAL_XPRA_CLIENT_URL}`}
                            />
                        ) : code.length > 0 && serverIsLive === false ? (
                            <div className="flex flex-col gap-4 justify-center items-center w-full h-full">
                                <AlertTriangle className="text-black size-8" />
                                <Button
                                    onClick={handleStartServer}
                                    disabled={isStartingServer}
                                >
                                    {isStartingServer && (
                                        <Loader2 className="animate-spin size-4" />
                                    )}
                                    {isStartingServer
                                        ? "Starting Server..."
                                        : "Start Server"}
                                </Button>
                            </div>
                        ) : isLoading || !currentPreview ? (
                            <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                                <Loader2 className="animate-spin size-8" />
                                <span className="text-lg">
                                    Loading preview...
                                </span>
                            </div>
                        ) : code.length > 0 && serverIsLive === null ? (
                            <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                                <Loader2 className="animate-spin size-8" />
                                <span className="text-lg">
                                    Checking server status...
                                </span>
                            </div>
                        ) : (
                            <iframe
                                className="w-full h-full border-0"
                                title="Preview"
                                src={`${process.env.NEXT_PUBLIC_LOCAL_XPRA_CLIENT_URL}`}
                            />
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        );
    }
);

Artifact.displayName = "Artifact";
