import { z } from "zod";

export const schema = z.object({
    commentary: z.string().describe(
        `If you are generating code, describe what you're about to do and the steps you want to take for generating the fragment in great detail. 
            
            Alternatively, if no code needs to be generated, simply respond to the user with a response. This response without code should be a natural response, not a commentary about the response.

            DO NOT ALWAYS GENERATE CODE. ONLY GENERATE CODE WHEN NECESSARY. DO NOT GENERATE CODE AS AN EXAMPLE IF IT IS ALREADY PRESENT.
            `
    ),
    // template: z
    //     .string()
    //     .describe("Name of the template used to generate the fragment."),
    // template_ready: z.boolean().describe('Detect if finished identifying the template.'),
    title: z.string().describe("Short title of the fragment. Max 3 words."),
    // description: z
    //     .string()
    //     .describe("Short description of the fragment. Max 1 sentence."),
    // additional_dependencies: z
    //     .array(z.string())
    //     .describe(
    //         "Additional dependencies required by the fragment. Do not include dependencies that are already included in the template."
    //     ),
    // has_additional_dependencies: z
    //     .boolean()
    //     .describe(
    //         "Detect if additional dependencies that are not included in the template are required by the fragment."
    //     ),
    // install_dependencies_command: z
    //     .string()
    //     .describe(
    //         "Command to install additional dependencies required by the fragment."
    //     ),
    // install_dependencies_ready: z.boolean().describe('Detect if finished identifying additional dependencies.'),
    // port: z
    //     .number()
    //     .nullable()
    //     .describe(
    //         "Port number used by the resulted fragment. Null when no ports are exposed."
    //     ),
    extension_name: z.string().describe("Name of the extension."),
    code: z
        .array(
            z.object({
                file_name: z.string().describe("Name of the file."),
                file_path: z
                    .string()
                    .describe(
                        "Relative path to the file, including the file name."
                    ),
                file_content: z.string().describe("Content of the file."),
                file_finished: z
                    .boolean()
                    .describe("Detect if finished generating the file."),
            })
        )
        .nullable()
        .describe(
            `
            Code generated by the agent. This field is OPTIONAL if the user's request does not require code generation.
            DO NOT ALWAYS GENERATE CODE. ONLY GENERATE CODE WHEN NECESSARY. DO NOT GENERATE CODE AS AN EXAMPLE IF IT IS ALREADY PRESENT.

            DO NOT GENERATE CODE AS AN EXAMPLE IF IT IS ALREADY PRESENT. DO NOT GENERATE CODE IF THE USER REFERS TO IT INQUISTIVELY, BUT DOES NOT ASK FOR IT.
            `
        ),
    // code_finished: z.boolean().describe('Detect if finished generating the code.'),
    // error: z.string().optional().describe('Error message if the fragment is not valid.'),
});

export type FragmentSchema = z.infer<typeof schema>;

export function isFragmentSchemaCode(
    input: unknown
): input is FragmentSchema["code"] {
    if (!Array.isArray(input)) return false;

    return input.every(
        (item) =>
            typeof item === "object" &&
            item !== null &&
            "file_name" in item &&
            typeof item.file_name === "string" &&
            "file_path" in item &&
            typeof item.file_path === "string" &&
            "file_content" in item &&
            typeof item.file_content === "string" &&
            "file_finished" in item &&
            typeof item.file_finished === "boolean"
    );
}
