import { schema } from "@/lib/schema";
import { z } from "zod";

export const CodeDataSchema = z
    .object({
        type: z.enum(["code-delta"]),
        content: schema.shape.code.unwrap().partial(),
    })
    .strict();

export type CodeData = z.infer<typeof CodeDataSchema>;
