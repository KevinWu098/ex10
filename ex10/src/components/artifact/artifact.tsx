"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState, Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { ayuLight } from "thememirror";

interface ArtifactProps {
    content: string;
}

export const Artifact = memo(function Artifact({ content }: ArtifactProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);

    const [value, setValue] = useState("code");

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
            className="grow"
            value={value}
            onValueChange={setValue}
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
});
