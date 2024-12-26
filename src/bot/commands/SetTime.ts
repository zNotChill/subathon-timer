import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";
import { formattedDurationToSeconds } from "../../utils/Time.ts";

export const SetTimeCommand: Command = {
  name: "settime",
  description: "Sets the time of the subathon.",
  usage: "settime <duration (secs)>",
  parameters: [
    {
      name: "duration",
      description: "The duration to set the subathon timer to. In seconds.",
      type: "number",
      required: true
    }
  ],
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    if (args.length === 0) {
      channel.send(`@${user}: please provide a duration.`);
      return;
    }
    
    let duration: number | string = args[0];

    if (duration.includes(":")) {
      let subtract = false;
      if (duration.startsWith("-")) subtract = true;

      duration = duration.replace("-", "");
      duration = formattedDurationToSeconds(duration) * (subtract ? -1 : 1);
    }

    if (isNaN(parseFloat(duration.toString()))) {
      channel.send(`@${user}: please provide a valid duration.`);
      return;
    }

    duration = parseInt(duration.toString());

    if (duration < 0) {
      channel.send(`@${user}: cannot set the timer to a negative value.`);
      return;
    }
    
    subathonManager.setTimer(duration);
    channel.send(`@${user}: set subathon timer to ${duration} seconds.`);
  }
}