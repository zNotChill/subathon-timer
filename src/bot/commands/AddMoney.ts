import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { dataManager, subathonManager } from "../../Manager.ts";

export const AddMoneyCommand: Command = {
  name: "addmoney",
  description: "Add/take money to/from the subathon.",
  usage: "addmoney <cost>",
  parameters: [
    {
      name: "cost",
      description: "The amount of money to add/take to/from the subathon.",
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

    cost = parseFloat(cost);

    // console.log(subathonManager.getDonationCount());
    // console.log(cost);
    
    if (cost < 0 && subathonManager.getDonationCount() - Math.abs(cost) < 0) {
      channel.send(`@${user}: cannot remove ${cost} ${dataManager.getSubathonConfig().currency} from the subathon. The donation count would be less than 0.`);
      return;
    }
    
    if (cost < 0) {
      subathonManager.removeMoneyFromDonationCount(cost);
      channel.send(`@${user}: removed ${Math.abs(cost)} ${dataManager.getSubathonConfig().currency} from the subathon.`);
      return;
    } else {
      subathonManager.addMoneyToDonationCount(cost);
      channel.send(`@${user}: added ${cost} ${dataManager.getSubathonConfig().currency} to the subathon.`);
      return;
    }
  }
}