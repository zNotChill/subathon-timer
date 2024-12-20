import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const SetBaseRateCommand: Command = {
  name: "setbaserate",
  description: "Change the base rate of the subathon multiplier.",
  usage: "setbaserate <rate>",
  parameters: [
    {
      name: "rate",
      description: "The rate to change to.",
      type: "number",
      required: true
    }
  ],
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    if (args.length === 0) {
      channel.send(`@${user}: please provide a base rate.`);
      return;
    }
    
    let rate: number | string = args[0];

    if (isNaN(parseFloat(rate))) {
      channel.send(`@${user}: please provide a valid rate.`);
      return;
    }

    rate = parseFloat(rate);

    subathonManager.baseRate = rate;

    channel.send(`@${user}: changing base rate to ${rate}x.`);
  }
}