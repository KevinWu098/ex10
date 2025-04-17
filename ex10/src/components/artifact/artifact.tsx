"use client";

import { memo, useEffect, useState } from "react";
import { ArtifactCode } from "@/components/artifact/artifact-code";
import { ArtifactFileNames } from "@/components/artifact/artifact-file-names";
import { DownloadZip } from "@/components/chat/download-zip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FragmentSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { DeepPartial } from "ai";

function formatFileContent(
    fragment: DeepPartial<FragmentSchema> | undefined,
    currentFile: string
): string | undefined {
    const content = fragment?.code?.find(
        (c) => c?.file_name === currentFile
    )?.file_content;

    // Unescape newline characters
    return content?.includes("\\n") ? content.replace(/\\n/g, "\n") : content;
}

interface ArtifactProps {
    fragment: DeepPartial<FragmentSchema> | undefined;
}

export const Artifact = memo(({ fragment }: ArtifactProps) => {
    const [value, setValue] = useState("code");
    const [currentFile, setCurrentFile] = useState<string>("");

    const content = formatFileContent(fragment, currentFile);

    // ! This is a hack.
    useEffect(() => {
        const firstFileName = fragment?.code?.at(0)?.file_name;

        if (firstFileName && !currentFile) {
            setCurrentFile(firstFileName);
        }
    }, [fragment?.code, currentFile]);

    if (!fragment) {
        return null;
    }

    return (
        <Tabs
            defaultValue="code"
            className="grow gap-0 overflow-hidden"
            value={value}
            onValueChange={setValue}
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
                    extensionName={fragment?.extension_name}
                    code={fragment?.code}
                />
            </div>

            <div
                className={cn(
                    "border-input shrink-0 gap-2 overflow-x-auto rounded-t-sm border border-b-0 p-2",
                    value === "code" ? "flex" : "hidden"
                )}
            >
                <ArtifactFileNames
                    code={fragment?.code}
                    currentFile={currentFile}
                    setCurrentFile={setCurrentFile}
                />

                {/* TODO: add copy button and download button */}
            </div>

            <div
                className={cn(
                    "border-input h-full overflow-auto rounded-b-sm border shadow-xs",
                    value === "code" ? "rounded-b-sm" : "rounded-sm"
                )}
            >
                <TabsContent
                    value="code"
                    forceMount // NB: forceMount prevents the code editor from being unmounted
                    className="flex h-full"
                >
                    <ArtifactCode
                        value={value}
                        content={content}
                    />
                </TabsContent>

                <TabsContent value="preview">
                    <div className="p-4">Preview content</div>
                </TabsContent>
            </div>
        </Tabs>
    );
});

Artifact.displayName = "Artifact";
