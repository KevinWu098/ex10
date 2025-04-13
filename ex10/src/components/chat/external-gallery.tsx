import React from "react";
import { GalleryItem, galleryItems } from "@/data/gallery";

export function ExternalGallery() {
    return (
        <div className="mt-16 flex gap-4">
            {galleryItems.map((item) => (
                <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-lg border border-gray-200"
                >
                    <div className="aspect-[16/8] bg-gray-100"></div>
                    <div className="p-4">
                        <h3 className="text-lg font-medium">{item.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
