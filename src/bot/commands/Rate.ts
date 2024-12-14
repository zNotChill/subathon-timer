import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const RateChangeCommand: Command = {
  name: "rate",
  description: "Change the rate of the subathon events!",
  usage: "rate <rate> <duration (mins)>",
  parameters: [
    {
      name: "rate",
      description: "The rate to change to.",
      type: "number",
      required: true
    },
    {
      name: "duration",
      description: "The duration to change the rate for.",
      type: "number",
      required: false
    }
  ],
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    if (args.length === 0) {
      channel.send(`@${user}, please provide a rate.`);
      return;
    }
    
    let rate: number | string = args[0];

    if (isNaN(parseFloat(rate))) {
      channel.send(`@${user}, please provide a valid rate.`);
      return;
    }

    let duration: number | string | undefined = args[1];

    if (!duration || isNaN(parseFloat(duration))) {
      duration = 5e30; // placeholder for infinite duration
    }

    if (subathonManager.isPaused()) {
      channel.send(`@${user}, the subathon is paused.`);
      return;
    }

    rate = parseFloat(rate);
    // if (subathonManager.globalMultiplier === rate) {
    //   channel.send(`@${user}, rate is already set to ${rate}.`);
    //   return;
    // }

    subathonManager.globalMultiplier = rate;
    subathonManager.globalMultiplierCountdown = parseFloat(duration.toString()) * 60;
    channel.send(`@${user}, changing rate to ${rate}x for ${duration} minutes.`);
  }
}