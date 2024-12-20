import { Channel } from "https://deno.land/x/tmi@v1.0.6/mod.ts";
import { Command } from "../../Bot.ts";
import { subathonManager } from "../../Manager.ts";

export const ResumeTimerCommand: Command = {
  name: "resumetimer",
  description: "Resume the subathon timer.",
  usage: "resumetimer",
  parameters: [],
  auth: true,
  execute: (_args: string[], channel: Channel, user: string) => {
    if (!subathonManager.isPaused()) {
      channel.send(`@${user}: the subathon is not paused.`);
      return;
    }

    subathonManager.unpauseTimer();
    channel.send(`@${user}: the subathon timer has been unpaused.`);
  }
}