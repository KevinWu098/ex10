import { Chat } from "@/components/chat/chat";

export default function Page() {
    return (
        <div className="flex h-full max-h-full w-full flex-row p-2">
            <Chat />
            <div className="shrink-0 grow">artifact</div>
        </div>
    );
}
