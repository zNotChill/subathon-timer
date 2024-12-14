import { TwitchChat, Channel } from "https://deno.land/x/tmi/mod.ts";
import { dataManager, storageManager, subathonManager } from "./Manager.ts";
import { Log } from "./Logger.ts";

export class BotManager {
  channel: Channel | undefined;
  twitchChat: TwitchChat | undefined;

  async start() {
    this.twitchChat = new TwitchChat(
      await storageManager.get("access_token"),
      dataManager.getData().config.expected_user.name
    );

    await this.twitchChat.connect();
    this.channel = this.twitchChat.joinChannel(dataManager.getData().config.channel.name);
    
    this.channel.addEventListener("join", (event) => {
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

const commands = new Map<string, Command>();

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
  auth: boolean;
  execute: (args: string[], channel: Channel, user: string) => void;
}

const RateChangeCommand: Command = {
  name: "rate",
  description: "Change the rate of the subathon events!",
  usage: "rate <rate> <duration (mins)>",
  auth: true,
  execute: (args: string[], channel: Channel, user: string) => {
    if (args.length === 0) {
      channel.send(`@${user}, please provide a rate.`);
      return;
    }
    
    let rate: number | string = args[0];

    if (isNaN(parseInt(rate))) {
      channel.send(`@${user}, please provide a valid rate.`);
      return;
    }

    let duration: number | string | undefined = args[1];

    if (!duration || isNaN(parseInt(duration))) {
      duration = 5e30; // placeholder for infinite duration
    }

    if (subathonManager.isPaused()) {
      channel.send(`@${user}, the subathon is paused.`);
      return;
    }

    rate = parseInt(rate);
    if (subathonManager.globalMultiplier === rate) {
      channel.send(`@${user}, rate is already set to ${rate}.`);
      return;
    }

    subathonManager.globalMultiplier = rate;
    subathonManager.globalMultiplierCountdown = parseInt(duration.toString()) * 60;
    channel.send(`@${user}, changing rate to ${rate}x for ${duration} minutes.`);
  }
}

commands.set(RateChangeCommand.name, RateChangeCommand);

// import tmi from "npm:tmi.js@1.8.3";
// import { dataManager, storageManager } from "./Manager.ts";

// export class BotManager {
//   client: tmi.Client;

//   constructor() {
//     const access_token = storageManager.get("access_token");
//     this.client = new tmi.Client({
//       options: { debug: true },
//       connection: {
//         reconnect: true,
//         secure: true
//       },
//       identity: {
//         username: dataManager.getConfig().expected_user.name,
//         password: Promise.resolve(access_token) as unknown as string
//       },
//       channels: [dataManager.getConfig().channel.name]
//     });
//     this.initialize();
//   }

//   async initialize() {
//     this.client.opts.identity.password = await storageManager.get("access_token") as string;
//   }

//   async start() {
//     await this.client.connect();
    
//     this.client.on("message", (channel: any, tags: any, message: any, self: any) => {
//       if (self) return;
      
//       if (message.startsWith("!hello")) {
//         this.client.say(channel, `@${tags.username}, Kill Yourself`);
//       }
//     });
//   }
// }