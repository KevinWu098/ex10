"use client";

import { Button } from "@/components/ui/button";
import { schema } from "@/lib/schema";
import { experimental_useObject as useObject } from "@ai-sdk/react";

export default function Page() {
    const { object, submit } = useObject({
        api: "/api/object",
        schema: schema,
    });

    console.log(object);

    return (
        <div>
            Playground{" "}
            <Button
                onClick={() =>
                    submit({
                        messages: [
                            {
                                role: "user",
                                content: "Generate a simple extension",
                            },
                        ],
                    })
                }
            >
                Click Me
            </Button>
            <div>{object?.commentary}</div>
        </div>
    );
}
