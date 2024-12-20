import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const PauseTimerCommand: Command = {
  name: "pausetimer",
  description: "Pause the subathon timer.",
  usage: "pausetimer",
  parameters: [],
  auth: true,
  execute: (_args: string[], channel: Channel, user: string) => {
    if (subathonManager.isPaused()) {
      channel.send(`@${user}: the subathon is already paused.`);
      return;
    }

    subathonManager.pauseTimer();
    channel.send(`@${user}: the subathon timer has been paused.`);
  }
}