import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { dataManager, subathonManager } from "../../Manager.ts";

export const SetMoneyCommand: Command = {
  name: "setmoney",
  description: "Sets the money of the subathon.",
  usage: "setmoney <cost>",
  parameters: [
    {
      name: "cost",
      description: "The duration to set the subathon timer to. In seconds.",
      type: "number",
      required: true
    }
  ],
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    if (args.length === 0) {
      channel.send(`@${user}: please provide a cost.`);
      return;
    }
    
    let cost: number | string = args[0];

    if (isNaN(parseFloat(cost))) {
      channel.send(`@${user}: please provide a valid cost.`);
      return;
    }

    cost = parseInt(cost);

    if (cost < 0) {
      channel.send(`@${user}: cannot set the money to a negative value.`);
      return;
    }
    
    subathonManager.setMoney(cost);
    channel.send(`@${user}: set subathon money to ${cost} ${dataManager.getSubathonConfig().currency}.`);
  }
}