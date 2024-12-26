import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const RefreshCommand: Command = {
  name: "refresh",
  description: "Refresh the timer and donations.",
  usage: "refresh",
  parameters: [],
  auth: true,
  execute: (_args: string[], channel: Channel, user: string) => {
    subathonManager.setTimerFromHistory();
    subathonManager.setDonationsFromHistory();
    channel.send(`@${user}: refreshed.`);
  }
}