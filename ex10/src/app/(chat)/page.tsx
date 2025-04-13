import Link from "next/link";
import { Chat } from "@/components/chat/chat";

// import { ExternalGallery } from "@/components/external-gallery/external-gallery";

export default async function Page() {
    return (
        <div className="flex h-full w-full max-w-5xl flex-col items-center">
            <Chat />
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
