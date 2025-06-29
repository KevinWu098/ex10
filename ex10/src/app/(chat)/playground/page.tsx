"use client";

import { Button } from "@/components/ui/button";
import { schema } from "@/lib/schema";
import { experimental_useObject as useObject } from "@ai-sdk/react";

export default function Page() {
    const { object, submit } = useObject({
        api: "/api/object",
        schema: schema,
    });

    return (
        <div>
            {/* Playground{" "}
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
 */}

            <iframe
                src="http://localhost:10000"
                style={
                    {
                        // width: "100%",
                        // height: "1200px",
                    }
                }
            />
        </div>
    );
}
