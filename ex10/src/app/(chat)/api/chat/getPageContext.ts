import { tool } from "ai";
import { z } from "zod";

export const getPageContext = tool({
    description: "Get the HTML and CSS content of the page",
    parameters: z.object({ sessionId: z.number() }),
    execute: async ({ sessionId }) => {
        console.log("NOT IMPLEMENTED YET");

        return "NOT IMPLEMENTED YET";

        // const response = await fetch(
        //     `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
        // );

        // const weatherData = await response.json();
        // return weatherData;
    },
});
