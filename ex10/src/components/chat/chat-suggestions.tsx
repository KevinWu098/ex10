import { ChatSuggestion } from "@/components/chat/chat-suggestion";

interface ChatSuggestionsProps {
    suggestions: string[];
    setInputValue: (value: string) => void;
    isLoading: string | undefined;
}

export function ChatSuggestions({
    suggestions,
    setInputValue,
    isLoading,
}: ChatSuggestionsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
                <ChatSuggestion
                    key={suggestion}
                    suggestion={suggestion}
                    setInputValue={setInputValue}
                    isLoading={isLoading}
                />
            ))}
        </div>
    );
}
