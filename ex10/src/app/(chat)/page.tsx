import { ChatLanding } from "@/components/chat/chat-landing";
import { generateUUID } from "@/lib/utils";

// import { ExternalGallery } from "@/components/external-gallery/external-gallery";

export default async function Page() {
    const id = generateUUID();

    return (
        <div className="flex h-full w-full max-w-5xl flex-col items-center">
            <ChatLanding id={id} />
            {/* <ExternalGallery /> */}
        </div>
    );
}
