import { ChatSuggestion } from "@/components/chat/chat-suggestion";

interface ChatSuggestionsProps {
    suggestions: string[];
    setInputValue: (value: string) => void;
}

export function ChatSuggestions({
    suggestions,
    setInputValue,
}: ChatSuggestionsProps) {
    return (
        <div className="flex flex-wrap justify-center-safe gap-2">
            {suggestions.map((suggestion) => (
                <ChatSuggestion
                    key={suggestion}
                    suggestion={suggestion}
                    setInputValue={setInputValue}
                />
            ))}
        </div>
    );
}
