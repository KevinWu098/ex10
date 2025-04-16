"use client";

import { useEffect, useRef, useState } from "react";
import { ArtifactFileNames } from "@/components/artifact/artifact-file-names";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FragmentSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { DeepPartial } from "ai";
import { basicSetup } from "codemirror";
import { ayuLight } from "thememirror";

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

export const Artifact = ({ fragment }: ArtifactProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);

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

    useEffect(() => {
        if (containerRef.current && !editorRef.current) {
            const startState = EditorState.create({
                doc: content,
                extensions: [
                    basicSetup,
                    javascript({ jsx: true, typescript: true }),
                    ayuLight,
                    EditorView.theme({
                        "&.cm-focused": {
                            outline: "none",
                        },
                        "&.cm-editor": {
                            backgroundColor: "#FFF",
                            height: "100%",
                        },
                        ".cm-gutters": {
                            // The !important is necessary )=
                            backgroundColor: "#FFF !important",
                        },
                    }),
                ],
            });

            editorRef.current = new EditorView({
                state: startState,
                parent: containerRef.current,
            });
        }

        return () => {
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };

        // NB: Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (editorRef.current) {
            const transaction = editorRef.current.state.update({
                changes: {
                    from: 0,
                    to: editorRef.current.state.doc.length,
                    insert: content,
                },
            });
            editorRef.current.dispatch(transaction);
        }
    }, [content]);

    return (
        <Tabs
            defaultValue="code"
            className="grow gap-0 overflow-hidden"
            value={value}
            onValueChange={setValue}
        >
            <div className="border-input mb-2 rounded-sm border p-2 shadow-xs">
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
            </div>

            <div className="border-input flex shrink-0 gap-2 overflow-x-auto rounded-t-sm border border-b-0 p-2">
                <ArtifactFileNames
                    code={fragment?.code}
                    currentFile={currentFile}
                    setCurrentFile={setCurrentFile}
                />

                {/* TODO: add copy button and download button */}
            </div>

            <div className="border-input h-full overflow-auto rounded-b-sm border shadow-xs">
                <TabsContent
                    value="code"
                    forceMount // NB: forceMount prevents the code editor from being unmounted
                    className="flex h-full"
                >
                    <div
                        className={cn(
                            "not-prose relative w-0 grow text-sm",
                            value === "preview" && "hidden" // NB: prevents rendering while forceMount (see above)
                        )}
                        ref={containerRef}
                    />
                </TabsContent>

                <TabsContent value="preview">
                    <div className="p-4">Preview content</div>
                </TabsContent>
            </div>
        </Tabs>
    );
};
