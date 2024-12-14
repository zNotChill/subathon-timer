#!/usr/bin/env deno run --allow-read --allow-write --allow-env
// deno-lint-ignore-file

import * as cliffy from "https://deno.land/x/cliffy@v0.25.7/mod.ts";
import { dataManager, subathonManager, twitchManager } from "./Manager.ts";
import { server, setAuthOverride } from "./Server.ts";
import { DataManager } from "./Data.ts";
import { Log } from "./Logger.ts";

DataManager.loadData();
let config = DataManager.getConfig();
let appdata = DataManager.getAppData();

let backup_interval;

const run = new cliffy.Command()
  .description("Run the services (server, Twitch API, etc).")
  .option("-a, --auth-override", "Override the authentication process.")
  .action(async () => {
    dataManager.loadData();
    
    if (appdata.first_run)
      await runSetup();

    if (!config.verify_signature) {
      for (let i = 0; i < 5; i++) {
        Log("WARNING: Signature verification is disabled. This is not recommended and should only be used for development.", "Main");
      }
    }

    // setAuthOverride(!!options.auth_override);
    await server;
    // await watchConfig(); error: Uncaught (in promise) ReferenceError: Cannot access 'options' before initialization

    backup_interval = setInterval(() => {
      const backupName = DataManager.saveBackup(DataManager.getData());
      Log(`Data has been backed up to ${backupName}`, "Backup");
    }, config.backup_frequency * 1000);
  });

const runSetup = async () => {
  Log("Running setup...", "Setup");

  appdata = DataManager.getAppData();

  Log(`Creating random secret key...`, "Setup");
  const key = crypto.getRandomValues(new Uint8Array(32));
  const keyString = btoa(String.fromCharCode(...key));

  Deno.writeFileSync(".env", new TextEncoder().encode(`SECRET_KEY=${keyString}`));

  Log("Setup complete.", "Setup");

  appdata.first_run = false;
  dataManager.saveData();
}

const { options } = await new cliffy.Command()
  .name("apricot")
  .version("0.1.0")
  .description("A CLI tool for managing your subathon.")
  .option("-c, --config <file:string>", "Path to the config file.", { default: "config.json" })
  .option("-a", "Auth Override")
  .command("run", run) // Run the services (server, Twitch API, etc).
  .parse(Deno.args);

if (options.authOverride) {
  setAuthOverride(true);
}