export interface GalleryItem {
    id: number;
    title: string;
    description: string;
}

export const galleryItems: GalleryItem[] = [
    {
        id: 1,
        title: "ex10.dev: A Case Study",
        description:
            "Technical(ish) deep-dive into the inspiration and implementation of ex10.dev",
    },
    {
        id: 2,
        title: "Open-Source Github",
        description:
            "Licensed under GNU General Public License, contributions welcome",
    },
    {
        id: 3,
        title: "Youtube Demo",
        description: "A 3 minute video of ex10.dev in action",
    },
];
