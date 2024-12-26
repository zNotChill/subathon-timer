#!/usr/bin/env deno run --allow-read --allow-write --allow-env
// deno-lint-ignore-file

import * as cliffy from "https://deno.land/x/cliffy@v0.25.7/mod.ts";
import { dataManager, storageManager, subathonManager, twitchManager } from "./Manager.ts";
import { StorageManager } from "./Storage.ts";
import { server, setAuthOverride } from "./Server.ts";
import { Data, DataManager } from "./Data.ts";
import { Log, Warn } from "./Logger.ts";

DataManager.loadData();
let config = DataManager.getConfig();
let appdata = DataManager.getAppData();

let backup_interval;

const run = new cliffy.Command()
  .description("Run the services (server, Twitch API, etc).")
  .option("-a, --auth-override", "Override the authentication process.")
  .option("-b, --backup <file:string>", "Load a backup file.")
  .action(async (options) => {
    dataManager.loadData();
    // dataManager.loadData();
    
    if (appdata.first_run)
      await runSetup();

    if (!config.verify_signature) {
      for (let i = 0; i < 5; i++) {
        Warn("WARNING: Signature verification is disabled. This is not recommended and should only be used for development.", "Main");
      }
    }

    setAuthOverride(!!options.authOverride);
    // await server;
    // await watchConfig(); error: Uncaught (in promise) ReferenceError: Cannot access 'options' before initialization
    try {
      await server;
    } catch (error) {
      if (error instanceof Deno.errors.AddrInUse) {
        console.error(`Port ${config.port} is already in use. Please use a different port.`);
        Deno.exit(1);
      } else {
        throw error;
      }
    }
    backup_interval = setInterval(() => {
      const backupName = DataManager.saveBackup(DataManager.getData());
      Log(`Data has been backed up to ${backupName}`, "Backup");
    }, config.backup_frequency * 1000);  
    
    setInterval(async () => {
      // refresh the access token every 30 minutes

      const refresh_data = await twitchManager.refreshAccessToken(await storageManager.get("refresh_token"));
      const bot_refresh_data = await twitchManager.refreshAccessToken(await storageManager.get("bot_refresh_token"));

      Log(`Access tokens refreshed.`, "Server");
      twitchManager.access_token = refresh_data.access_token;
      twitchManager.refresh_token = refresh_data.refresh_token;
      storageManager.set("access_token", refresh_data.access_token);
      storageManager.set("refresh_token", refresh_data.refresh_token);
  
      storageManager.set("bot_access_token", bot_refresh_data.access_token);
      storageManager.set("bot_refresh_token", bot_refresh_data.refresh_token);
      await dataManager.saveData();
    }, 30 * 1000 * 60); // 30 minutes

    if (options.backup) {
      Log(`Loading backup file ${options.backup}...`, "Backup");
      const data = dataManager.loadBackup(options.backup);

      if (!data) {
        Log(`Backup file ${options.backup} not found.`, "Backup");
        return;
      }

      subathonManager.loadFromData(data);
      
      Log(`Backup file ${options.backup} loaded.`, "Backup");
    }
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
  .option("-i, --auth-info", "Prints the authentication information.")
  .command("run", run)
  .parse(Deno.args);

if (options.authInfo) {
  try {
    const storageManager = new StorageManager();
    let access_token = await storageManager.get("access_token");
    let refresh_token = await storageManager.get("refresh_token");
    let streamlabs_access_token = await storageManager.get("streamlabs_access_token");
    let bot_access_token = await storageManager.get("bot_access_token");
    let bot_refresh_token = await storageManager.get("bot_refresh_token");
    
    console.log(`------------ CONFIG ------------`);
    console.log(`Client ID: ${config.client.id}`);
    console.log(`Client Secret: ${config.client.secret}`);
    console.log(`Callback URL: ${config.client.callback_url}`);
    console.log(`------------ AUTHENTICATION ------------`);
    console.log(`Twitch Access Token: ${access_token}`);
    console.log(`Twitch Refresh Token: ${refresh_token}`);
    console.log(`Streamlabs Access Token: ${streamlabs_access_token}`);
    console.log(`Streamlabs Refresh Token: *streamlabs doesn't need refreshing, token is permanent*`);
    console.log(`Bot Access Token: ${bot_access_token}`);   
    console.log(`Bot Refresh Token: ${bot_refresh_token}`);
  } catch (error) {
    console.error("Error while getting authentication information.");
  }
  
  Deno.exit();
}