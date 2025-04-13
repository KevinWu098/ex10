import { Chat } from "@/components/chat/chat";

export default function Page() {
    return (
        <div className="flex h-full w-full flex-row p-2">
            <Chat />
            <div className="w-3/5">artifact</div>
        </div>
    );
}
