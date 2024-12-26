import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const EstimatedEndCommand: Command = {
  name: "estimatedend",
  aliases: ["ete", "ee", "end"],
  description: "Get the estimated end time of the subathon.",
  usage: "estimatedend",
  parameters: [],
  auth: false,
  execute: (_args: string[], channel: Channel, user: string) => {
    try {
      const estimatedEnd = subathonManager.getEstimatedEnd();

      const date = new Date(estimatedEnd);
      const dateString = date.toLocaleString("en-US", { timeZone: "UTC" });
      channel.send(`@${user}: the estimated end time of the subathon is ${dateString} UTC.`);
    } catch (error) {
      console.error(error);
      channel.send(`@${user}: an error occurred while running this command.`);
    }
  }
}