"use client";

import { memo, useEffect, useState } from "react";
import { ArtifactCode } from "@/components/artifact/artifact-code";
import { ArtifactFileNames } from "@/components/artifact/artifact-file-names";
import { DownloadZip } from "@/components/chat/download-zip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FragmentSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { DeepPartial } from "ai";
import { Loader2 } from "lucide-react";

export function formatFileContent(
    code: DeepPartial<FragmentSchema>["code"] | undefined,
    currentFile: string
): string | undefined {
    const content = code?.find(
        (c) => c?.file_name === currentFile
    )?.file_content;

    // Unescape newline characters
    return content?.includes("\\n") ? content.replace(/\\n/g, "\n") : content;
}

interface ArtifactProps {
    code: DeepPartial<FragmentSchema>["code"] | undefined;
    isLoading: boolean;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    currentPreview: string | undefined;
}

export const Artifact = memo(
    ({
        code,
        isLoading,
        currentTab,
        setCurrentTab,
        currentPreview,
    }: ArtifactProps) => {
        const [currentFile, setCurrentFile] = useState<string>("");

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
                className="gap-0 overflow-hidden grow"
                value={currentTab}
                onValueChange={setCurrentTab}
            >
                <div className="flex justify-between p-2 mb-2 border rounded-sm shadow-xs border-input">
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
                        className="flex h-full"
                        forceMount // NB: forceMount prevents the preview from being unmounted
                    >
                        {isLoading || !currentPreview ? (
                            <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                                <Loader2 className="size-8 animate-spin" />
                                <span className="text-lg">
                                    Loading preview...
                                </span>
                            </div>
                        ) : (
                            <iframe
                                className="w-full h-full border-0"
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
