import { DataManager } from "./Data.ts";
import { StorageManager } from "./Storage.ts";
import { StreamlabsManager } from "./Streamlabs.ts";
import { SubathonManager } from "./Subathon.ts";
import { TwitchManager } from "./Twitch.ts";

export const dataManager = DataManager;

dataManager.loadData();
export const subathonManager = new SubathonManager();
export const twitchManager = new TwitchManager(subathonManager);
export const streamlabsManager = new StreamlabsManager();
export const storageManager = new StorageManager();