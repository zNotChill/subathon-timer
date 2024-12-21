import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { dataManager, subathonManager } from "../../Manager.ts";

export const AddGoalCommand: Command = {
  name: "addgoal",
  description: "Add a donation goal.",
  usage: "addgoal <cost> <description>",
  parameters: [
    {
      name: "cost",
      description: "The cost of the goal.",
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
        channel.send(`@${user}: please provide a cost and description.`);
        return;
      }

      const cost: number = parseFloat(args[0]);
      const description: string = args.slice(1).join(" ");
      const override: boolean = false;
    
      if (isNaN(cost)) {
        channel.send(`@${user}: please provide a valid cost.`);
        return;
      }

      const doesGoalExist = subathonManager.findGoal(cost);

      if (doesGoalExist && !override) {
        channel.send(`@${user}: a goal with that cost already exists. Please use a different cost or remove the existing goal.`);
        return;
      } else if (doesGoalExist && override) {
        subathonManager.removeGoal(cost);
      }

      subathonManager.addGoal(cost, description);
      channel.send(`@${user}: added a goal with a cost of ${cost} ${dataManager.getSubathonConfig().currency}.`);
    } catch (error) {
      console.error(error);
      channel.send(`@${user}: an error occurred while running this command.`);
    }
  }
}