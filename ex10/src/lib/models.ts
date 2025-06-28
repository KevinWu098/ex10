import { openai } from "@ai-sdk/openai";
import { vercel } from "@ai-sdk/vercel";

// Default model configuration
export const DEFAULT_MODEL = openai("gpt-4o-mini");

// Alternative model configurations if needed
export const VERCEL_MODEL = vercel("v0-1.0-md");

// Function to get the model based on configuration or environment variables
export function getModel(type: "default" | "vercel" = "default") {
    // You could add logic here to read from environment variables
    // or other configuration sources
    switch (type) {
        case "vercel":
            return VERCEL_MODEL;
        default:
            return DEFAULT_MODEL;
    }
}
