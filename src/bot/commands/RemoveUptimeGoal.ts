import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const RemoveUptimeGoalComamnd: Command = {
  name: "removeuptimegoal",
  description: "Remove an uptime goal.",
  usage: "removeuptimegoal <duration>",
  parameters: [
    {
      name: "duration",
      description: "The duration of the goal to remove in seconds.",
      type: "number",
      required: true
    }
  ],
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    try {
      if (args.length < 1) {
        channel.send(`@${user}: please provide a duration.`);
        return;
      }

      const duration: number = parseFloat(args[0]);
    
      if (isNaN(duration)) {
        channel.send(`@${user}: please provide a valid duration.`);
        return;
      }

      const doesGoalExist = subathonManager.findUptimeGoal(duration);

      if (!doesGoalExist) {
        channel.send(`@${user}: a goal with that duration does not exist.`);
        return;
      }

      subathonManager.removeGoal(duration);
      channel.send(`@${user}: removed ${duration} second goal for ${doesGoalExist.title}.`);
    } catch (error) {
      console.error(error);
      channel.send(`@${user}: an error occurred while running this command.`);
    }
  }
}