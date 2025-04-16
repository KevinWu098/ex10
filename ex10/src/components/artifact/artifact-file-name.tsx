import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { FragmentSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { DeepPartial } from "ai";
import { FileText } from "lucide-react";

interface ArtifactFileNameProps {
    files: NonNullable<DeepPartial<FragmentSchema>["code"]>[number];
    currentFile: string;
    setCurrentFile: (file: string) => void;
}

export const ArtifactFileName = memo(
    ({ files, currentFile, setCurrentFile }: ArtifactFileNameProps) => {
        if (!files) {
            return null;
        }

        const { file_name } = files;

        if (!file_name) {
            return null;
        }

        const handleClick = () => {
            setCurrentFile(file_name);
        };

        return (
            <Button
                key={file_name}
                variant="ghost"
                className={cn(
                    "text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-sm border text-sm select-none",
                    file_name === currentFile ? "bg-muted border-muted" : ""
                )}
                onClick={handleClick}
            >
                <FileText className="size-4" />
                {file_name}
            </Button>
        );
    }
);

ArtifactFileName.displayName = "ArtifactFileName";
