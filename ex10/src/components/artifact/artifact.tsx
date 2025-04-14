"use client";

import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState, Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { ayuLight } from "thememirror";

interface ArtifactProps {
    content: string;
}

export function Artifact({ content }: ArtifactProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);

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
        // NOTE: we only want to run this effect once
        // eslint-disable-next-line
    }, []);

    return (
        <Tabs
            defaultValue="code"
            className="grow"
        >
            <div className="border-input rounded-sm border p-2 shadow-xs">
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

            <div className="border-input h-full max-h-full overflow-auto rounded-sm border pt-2 shadow-xs">
                <TabsContent value="code">
                    <div
                        className="not-prose relative w-full text-sm"
                        ref={containerRef}
                    />
                </TabsContent>

                <TabsContent value="preview">
                    <div className="p-4">Preview content</div>
                </TabsContent>
            </div>
        </Tabs>
    );
}
