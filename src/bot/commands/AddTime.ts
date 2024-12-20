import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const AddTimeCommand: Command = {
  name: "addtime",
  description: "Add/take time to/from the subathon.",
  usage: "addtime <duration (secs)>",
  parameters: [
    {
      name: "duration",
      description: "The duration to add to the subathon. In seconds.",
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

    if (isNaN(parseFloat(duration))) {
      channel.send(`@${user}: please provide a valid duration.`);
      return;
    }

    duration = parseInt(duration);

    subathonManager.addTimeToTimer(duration);
    channel.send(`@${user}: added ${duration} seconds to the timer.`);
  }
}