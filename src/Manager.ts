import { DataManager } from "./Data.ts";
import { StreamlabsManager } from "./Streamlabs.ts";
import { SubathonManager } from "./Subathon.ts";
import { TwitchManager } from "./Twitch.ts";

export const dataManager = DataManager;

dataManager.loadData();
export const subathonManager = new SubathonManager(dataManager.getSubathonConfig());
export const twitchManager = new TwitchManager(dataManager.getConfig(), subathonManager);
export const streamlabsManager = new StreamlabsManager(dataManager.getConfig());