import { TwitchChat, Channel } from "https://deno.land/x/tmi/mod.ts";
import { dataManager, storageManager } from "./Manager.ts";
import { Log } from "./Logger.ts";
import { RateChangeCommand } from "./bot/commands/Rate.ts";

export class BotManager {
  channel: Channel | undefined;
  twitchChat: TwitchChat | undefined;
  logged_in: boolean = false;

  async start() {
    this.twitchChat = new TwitchChat(
      await storageManager.get("bot_access_token"),
      dataManager.getData().config.expected_user.name
    );

    await this.twitchChat.connect();
    this.channel = this.twitchChat.joinChannel(dataManager.getData().config.channel.name);
    
    this.channel.addEventListener("join", (event) => {
      this.logged_in = true;
      Log(`Joined channel ${event.channel}`, "BotManager");
    });

    // for some reason its called privmsg
    this.channel.addEventListener("privmsg", (event) => {
      const message = event.message;

      if (!message.startsWith(dataManager.getData().config.bot_prefix)) return;

      const command = message.split(" ")[0].substring(1);
      const commandFunction = getCommand(command);

      if (
        !dataManager.getConfig().bot_authorized_users.includes(event.username)
        && commandFunction?.auth
      ) return;
      
      commandFunction?.execute(message.split(" ").slice(1), this.channel as Channel, event.username);
    });
  }
}

export const commands = new Map<string, Command>();

export const registerCommand = (command: Command) => {
  commands.set(command.name, command);
}

export const getCommand = (name: string) => {
  return commands.get(name);
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  parameters: {
    name: string;
    description: string;
    type: "string" | "number" | "boolean";
    required: boolean
  }[];
  auth: boolean;
  execute: (args: string[], channel: Channel, user: string) => void;
}

commands.set(RateChangeCommand.name, RateChangeCommand);