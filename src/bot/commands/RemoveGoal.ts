import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { dataManager, subathonManager } from "../../Manager.ts";

export const RemoveGoalCommand: Command = {
  name: "removegoal",
  description: "Remove a donation goal.",
  usage: "removegoal <cost>",
  parameters: [
    {
      name: "cost",
      description: "The cost of the goal to remove.",
      type: "number",
      required: true
    }
  ],
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    try {
      if (args.length < 1) {
        channel.send(`@${user}: please provide a cost.`);
        return;
      }

      const cost: number = parseFloat(args[0]);
    
      if (isNaN(cost)) {
        channel.send(`@${user}: please provide a valid cost.`);
        return;
      }

      const doesGoalExist = subathonManager.findGoal(cost);

      if (!doesGoalExist) {
        channel.send(`@${user}: a goal with that cost does not exist.`);
        return;
      }

      subathonManager.removeGoal(cost);
      channel.send(`@${user}: removed ${cost} ${dataManager.getSubathonConfig().currency} goal for ${doesGoalExist.title}.`);
    } catch (error) {
      console.error(error);
      channel.send(`@${user}: an error occurred while running this command.`);
    }
  }
}