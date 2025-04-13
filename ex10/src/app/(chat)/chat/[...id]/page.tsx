import { Artifact } from "@/components/artifact/artifact";
import { Chat } from "@/components/chat/chat";

export default async function Page() {
    return (
        <div className="flex h-full max-h-full w-full flex-row gap-4 p-2">
            <Chat />
            <Artifact content={"const foo = 'I love Javascript'"} />
        </div>
    );
}
