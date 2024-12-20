import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { botManager, twitchManager } from "../../Manager.ts";

export const AddAuthUserCommand: Command = {
  name: "addauthuser",
  description: "Give a user permission to use authed commands.",
  usage: "addauthuser <user>",
  parameters: [
    {
      name: "user",
      description: "The user to give permission to.",
      type: "string",
      required: true
    }
  ],
  auth: true,
  execute: async (args: string[], channel: Channel, user: string) => {
    if (args.length === 0) {
      channel.send(`@${user}: please provide a user.`);
      return;
    }
    
    const twitchUser: string = args[0];
    const validatedTwitchUser = await twitchManager.getUserInfoFromName(twitchUser);
    
    if (validatedTwitchUser.data.length === 0) {
      channel.send(`@${user}: please provide a valid user.`);
      return;
    }

    const name = validatedTwitchUser.data[0].login;
    const isUserAlreadyAuthed = botManager.isUserAuthed(name);

    if (isUserAlreadyAuthed) {
      channel.send(`@${user}: ${name} is already an authed user.`);
      return;
    }

    botManager.addAuthedUser(name);
    channel.send(`@${user}: ${name} was granted bot authentication.`);
  }
}