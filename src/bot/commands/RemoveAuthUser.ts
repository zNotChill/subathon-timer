import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { botManager, twitchManager } from "../../Manager.ts";

export const RemoveAuthUserCommand: Command = {
  name: "removeauthuser",
  description: "Revoke a user's permission to use authed commands.",
  usage: "removeauthuser <user>",
  parameters: [
    {
      name: "user",
      description: "The user to revoke permission from.",
      type: "string",
      required: true
    }
  ],
  auth: true,
  execute: async (args: string[], channel: Channel, user: string) => {
    try {
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
  
      if (!isUserAlreadyAuthed) {
        channel.send(`@${user}: ${name} is already not an authed user.`);
        return;
      }
  
      botManager.removeAuthedUser(name);
      channel.send(`@${user}: ${name} was revoked bot authentication.`);
    } catch (error) {
      console.error(error);
      channel.send(`@${user}: an error occurred while removing the user.`);
    }
  }
}