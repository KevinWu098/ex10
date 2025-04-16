import { useCallback } from "react";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";

interface ChatSuggestionProps {
    suggestion: string;
    setInputValue: (value: string) => void;
}

export function ChatSuggestion({
    suggestion,
    setInputValue,
}: ChatSuggestionProps) {
    // TODO: Auto submit the suggestion
    const handleClick = useCallback(() => {
        setInputValue(suggestion);
    }, [suggestion, setInputValue]);

    return (
        <PromptSuggestion
            onClick={handleClick}
            className="rounded-full font-normal"
        >
            {suggestion}
        </PromptSuggestion>
    );
}
