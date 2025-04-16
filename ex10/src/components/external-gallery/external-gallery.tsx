import { galleryItems } from "@/components/external-gallery/external-gallery-data";

export function ExternalGallery() {
    return (
        <div className="mt-16 grid grid-cols-3 gap-4">
            {galleryItems.map((item) => (
                <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-lg border border-gray-200"
                >
                    <div className="aspect-video bg-gray-100"></div>
                    <div className="space-y-1 p-4">
                        <h3 className="text-lg font-medium">{item.title}</h3>
                        <p className="text-sm text-pretty text-gray-600">
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
