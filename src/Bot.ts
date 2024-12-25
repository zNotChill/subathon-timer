import { TwitchChat, Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { dataManager, storageManager } from "./Manager.ts";
import { Log } from "./Logger.ts";
import { RateChangeCommand } from "./bot/commands/Rate.ts";
import { AddTimeCommand } from "./bot/commands/AddTime.ts";
import { SetBaseRateCommand } from "./bot/commands/SetBaseRate.ts";
import { RatesCommand } from "./bot/commands/Rates.ts";
import { PauseTimerCommand } from "./bot/commands/PauseTimer.ts";
import { ResumeTimerCommand } from "./bot/commands/ResumeTimer.ts";
import { AddAuthUserCommand } from "./bot/commands/AddAuthUser.ts";
import { RemoveAuthUserCommand } from "./bot/commands/RemoveAuthUser.ts";
import { AddGoalCommand } from "./bot/commands/AddGoal.ts";
import { RemoveGoalCommand } from "./bot/commands/RemoveGoal.ts";
import { AddUptimeGoalCommand } from "./bot/commands/AddUptimeGoal.ts";
import { RemoveUptimeGoalComamnd } from "./bot/commands/RemoveUptimeGoal.ts";
import { AddMoneyCommand } from "./bot/commands/AddMoney.ts";
import { SetUptimeCommand } from "./bot/commands/SetUptime.ts";

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

  addAuthedUser(user: string) {
    dataManager.getConfig().bot_authorized_users.push(user);
    dataManager.saveData();
  }

  removeAuthedUser(user: string) {
    dataManager.getConfig().bot_authorized_users = dataManager.getConfig().bot_authorized_users.filter((u) => u !== user);
    dataManager.saveData();
  }

  isUserAuthed(user: string) {
    return dataManager.getConfig().bot_authorized_users.includes(user);
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
    required: boolean,
    default?: string;
  }[];
  auth: boolean;
  execute: (args: string[], channel: Channel, user: string) => void;
}

commands.set(RateChangeCommand.name, RateChangeCommand);
commands.set(AddTimeCommand.name, AddTimeCommand);
commands.set(SetBaseRateCommand.name, SetBaseRateCommand);
commands.set(RatesCommand.name, RatesCommand);
commands.set(PauseTimerCommand.name, PauseTimerCommand);
commands.set(ResumeTimerCommand.name, ResumeTimerCommand);
commands.set(AddAuthUserCommand.name, AddAuthUserCommand);
commands.set(RemoveAuthUserCommand.name, RemoveAuthUserCommand);
commands.set(AddGoalCommand.name, AddGoalCommand);
commands.set(RemoveGoalCommand.name, RemoveGoalCommand);
commands.set(AddUptimeGoalCommand.name, AddUptimeGoalCommand);
commands.set(RemoveUptimeGoalComamnd.name, RemoveUptimeGoalComamnd);
commands.set(AddMoneyCommand.name, AddMoneyCommand);
commands.set(SetUptimeCommand.name, SetUptimeCommand);