import {
    artifactKinds,
    documentHandlersByArtifactKind,
} from "@/lib/artifacts/server";
import { generateUUID } from "@/lib/utils";
import { DataStreamWriter, tool } from "ai";
import { z } from "zod";

interface CreateDocumentProps {
    dataStream: DataStreamWriter;
}

export const generateExtension = ({ dataStream }: CreateDocumentProps) =>
    tool({
        description:
            "Generate an extension based on the prompt. This tool will call other functions to generate the extension's code and configuration files.",
        parameters: z.object({
            prompt: z.string(),
        }),
        execute: async ({ prompt }) => {
            const id = generateUUID();

            dataStream.writeData({
                type: "prompt",
                content: prompt,
            });

            dataStream.writeData({
                type: "id",
                content: id,
            });

            // dataStream.writeData({
            //     type: "title",
            //     content: title,
            // });

            // dataStream.writeData({
            //     type: "clear",
            //     content: "",
            // });

            const documentHandler = documentHandlersByArtifactKind.find(
                (documentHandlerByArtifactKind) =>
                    documentHandlerByArtifactKind.kind === kind
            );

            if (!documentHandler) {
                throw new Error(`No document handler found for kind: ${kind}`);
            }

            await documentHandler.onCreateDocument({
                id,
                title,
                dataStream,
                session,
            });

            dataStream.writeData({ type: "finish", content: "" });

            return {
                id,
                title,
                kind,
                content:
                    "A document was created and is now visible to the user.",
            };
        },
    });
