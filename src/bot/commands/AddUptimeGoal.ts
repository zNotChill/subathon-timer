import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const AddUptimeGoalCommand: Command = {
  name: "adduptimegoal",
  description: "Add an uptime goal.",
  usage: "adduptimegoal <duration (seconds)> <description>",
  parameters: [
    {
      name: "duration",
      description: "The duration to add to the subathon. In seconds.",
      type: "number",
      required: true
    },
    {
      name: "description",
      description: "The description of the goal.",
      type: "string",
      required: true
    }
  ],
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    try {
      if (args.length < 2) {
        channel.send(`@${user}: please provide a duration and description.`);
        return;
      }

      const duration: number = parseFloat(args[0]);
      const description: string = args.slice(1).join(" ");
      const override: boolean = false;
    
      if (isNaN(duration)) {
        channel.send(`@${user}: please provide a valid duration.`);
        return;
      }

      const doesGoalExist = subathonManager.findUptimeGoal(duration);

      if (doesGoalExist && !override) {
        channel.send(`@${user}: a goal with that duration already exists. Please use a different uptime or remove the existing goal.`);
        return;
      } else if (doesGoalExist && override) {
        subathonManager.removeUptimeGoal(duration);
      }

      subathonManager.addUptimeGoal(duration, description);
      channel.send(`@${user}: added a goal with a duration of ${duration} seconds.`);
    } catch (error) {
      console.error(error);
      channel.send(`@${user}: an error occurred while running this command.`);
    }
  }
}