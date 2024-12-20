import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { dataManager } from "../../Manager.ts";

export const RatesCommand: Command = {
  name: "rates",
  description: "View the subathon rates.",
  usage: "rates",
  parameters: [],
  auth: false,
  execute: (_args: string[], channel: Channel, user: string) => {
    channel.send(`@${user}: see the rates at: ${dataManager.getConfig().page_url}/rates`);
  }
}