import Link from "next/link";
import { ChatLanding } from "@/components/chat/chat-landing";
import { generateUUID } from "@/lib/utils";

// import { ExternalGallery } from "@/components/external-gallery/external-gallery";

export default async function Page() {
    const id = generateUUID();

    return (
        <div className="flex h-full w-full max-w-5xl flex-col items-center">
            <ChatLanding id={id} />
            {/* <ExternalGallery /> */}

            <span className="text-muted-foreground mt-auto mb-3 text-sm">
                Built with 💖 for the{" "}
                <Link
                    href="https://x.com/nextjs/status/1909009715880681801"
                    className="underline hover:text-gray-600"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Next.js Global Hackathon
                </Link>
            </span>
        </div>
    );
}
