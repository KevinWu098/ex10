"use client";

import { memo, useEffect, useState } from "react";
import { ArtifactCode } from "@/components/artifact/artifact-code";
import { ArtifactFileNames } from "@/components/artifact/artifact-file-names";
import { DownloadZip } from "@/components/chat/download-zip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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
}

export const Artifact = memo(
    ({
        fragment,
        isLoading,
        currentTab,
        setCurrentTab,
        currentPreview,
    }: ArtifactProps) => {
        const [currentFile, setCurrentFile] = useState<string>("");

        const code = Object.values(fragment);
        const content = formatFileContent(code, currentFile);

        // ! This is a hack.
        useEffect(() => {
            const firstFileName = code?.at(0)?.file_name;

            if (firstFileName && !currentFile) {
                setCurrentFile(firstFileName);
            }
        }, [code, currentFile]);

        if (!code) {
            return null;
        }

        return (
            <Tabs
                defaultValue="code"
                className="grow gap-0 overflow-hidden"
                value={currentTab}
                onValueChange={setCurrentTab}
            >
                <div className="border-input mb-2 flex justify-between rounded-sm border p-2 shadow-xs">
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
                        {isLoading || !currentPreview ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                                <Loader2 className="size-8 animate-spin" />
                                <span className="text-lg">
                                    Loading preview...
                                </span>
                            </div>
                        ) : (
                            <iframe
                                className="h-full w-full border-0"
                                title="Preview"
                                src={`${process.env.NEXT_PUBLIC_XPRA_SERVER_URL}/session/${currentPreview}`}
                            />
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        );
    }
);

Artifact.displayName = "Artifact";
