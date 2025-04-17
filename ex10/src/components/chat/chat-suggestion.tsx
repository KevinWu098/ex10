import { useCallback } from "react";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { Loader2 } from "lucide-react";

interface ChatSuggestionProps {
    suggestion: string;
    setInputValue: (value: string) => void;
    isLoading?: string;
}

export function ChatSuggestion({
    suggestion,
    setInputValue,
    isLoading,
}: ChatSuggestionProps) {
    const loading = isLoading === suggestion;

    const handleClick = useCallback(() => {
        setInputValue(suggestion);
    }, [suggestion, setInputValue]);

    return (
        <PromptSuggestion
            onClick={handleClick}
            className="w-fit shrink-0 rounded-full font-normal"
            disabled={!!isLoading}
        >
            {suggestion}
            {loading && <Loader2 className="size-4 animate-spin" />}
        </PromptSuggestion>
    );
}
