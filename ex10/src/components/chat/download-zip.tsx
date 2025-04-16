import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FragmentSchema } from "@/lib/schema";
import { DeepPartial } from "ai";
import JSZip from "jszip";
import { DownloadIcon } from "lucide-react";

interface DownloadZipProps {
    extensionName: string | undefined;
    code: DeepPartial<FragmentSchema>["code"] | undefined;
}

export function DownloadZip({ extensionName, code }: DownloadZipProps) {
    const files =
        code?.reduce(
            (acc, file) => {
                if (file?.file_path && file?.file_content) {
                    acc[file.file_path] = file.file_content;
                }
                return acc;
            },
            {} as Record<string, string>
        ) ?? {};

    const handleClick = async () => {
        const zip = new JSZip();
        Object.entries(files).forEach(([path, content]) => {
            zip.file(path, content);
        });

        const blob = await zip.generateAsync({ type: "blob" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `${extensionName ?? "extension"}.zip`;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClick}
                    >
                        <DownloadIcon />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as ZIP</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
