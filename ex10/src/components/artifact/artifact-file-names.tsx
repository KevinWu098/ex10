import { ArtifactFileName } from "@/components/artifact/artifact-file-name";
import type { FragmentSchema } from "@/lib/schema";
import { DeepPartial } from "ai";

interface ArtifactFileNamesProps {
    code: DeepPartial<FragmentSchema>["code"] | undefined;
    currentFile: string;
    setCurrentFile: (file: string) => void;
}

export function ArtifactFileNames({
    code,
    currentFile,
    setCurrentFile,
}: ArtifactFileNamesProps) {
    if (!code) {
        return null;
    }

    return code.map((files, index) => (
        <ArtifactFileName
            key={index}
            files={files}
            currentFile={currentFile}
            setCurrentFile={setCurrentFile}
        />
    ));
}
