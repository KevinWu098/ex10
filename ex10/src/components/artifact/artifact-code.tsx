import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { ayuLight } from "thememirror";

interface ArtifactCodeProps {
    value: string;
    content: string | undefined;
}

export const ArtifactCode = ({ value, content }: ArtifactCodeProps) => {
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
        <div
            className={cn(
                "not-prose relative w-0 grow text-sm",
                value === "preview" && "hidden" // NB: prevents rendering while forceMount (see above)
            )}
            ref={containerRef}
        />
    );
};
