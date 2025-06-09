import { ArtifactFileName } from "@/components/artifact/artifact-file-name";
import { CodeData } from "@/lib/data";

interface ArtifactFileNamesProps {
    code: CodeData["content"][];
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
