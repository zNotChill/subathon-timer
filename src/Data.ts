import { Event, SubathonData } from "./types/Subathon.ts";

export type Data = {
  config: Config,
  app: AppData,
  subathon_config: SubathonData,
  backup_info: BackupInfo
}

export type Config = {
  client: {
    id: string,
    secret: string,
    callback_url: string,
    bot_callback_url: string,
    scopes: string[]
  },
  streamlabs_client: {
    id: string,
    secret: string,
    callback_url: string,
    scopes: string[]
  },
  port: number,
  api_base: "https://api.twitch.tv/helix",
  eventsub_url: "https://api.twitch.tv/helix/eventsub/subscriptions",
  eventsub_callback: string,
  secret_key: string,
  channel: {
    name: string,
    id: string
  },
  expected_user: {
    name: string,
    id: string
  },
  bot_user: {
    name: string,
    id: string
  },
  use_ngrok: boolean,
  backup_frequency: number,
  verify_signature: boolean,
  bot_prefix: string,
  bot_authorized_users: string[],
  page_url: string,
  tip_url: string,
}

export type AppData = {
  first_run: boolean,
  ngrok_url: string,
}

export type BackupInfo = {
  global_multiplier: number,
  global_multiplier_countdown: number,
  base_rate: number,
  timer: number,
  uptime: number,
  donations: number,
  donation_goal: number,
}

export const globalData: Data = {
  config: {
    client: {
      id: "client_id",
      secret: "client_secret",
      callback_url: `{URL}/twitch/callback`,
      bot_callback_url: `{URL}/twitch/bot/callback`,
      scopes: [
        "channel:read:redemptions",
        "channel:manage:redemptions",
        "channel:moderate",
        "channel:read:subscriptions"
      ]
    },
    streamlabs_client: {
      id: "streamlabs_client_id",
      secret: "streamlabs_client_secret",
      callback_url: `{URL}/streamlabs/callback`,
      scopes: [
        "donations.read",
        "donations.create",
        "alerts.create",
        "alerts.update",
        "socket.token"
      ]
    },
    port: 4450, // Change this to a different port if needed
    api_base: "https://api.twitch.tv/helix",
    eventsub_url: "https://api.twitch.tv/helix/eventsub/subscriptions",
    eventsub_callback: "{URL}/eventsub",
    secret_key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    channel: {
      name: "channel_name",
      id: "channel_id"
    },
    expected_user: {
      name: "expected_user_name",
      id: "expected_user_id"
    },
    bot_user: {
      name: "bot_user_name",
      id: "bot_user_id"
    },
    use_ngrok: true,
    backup_frequency: 60,
    verify_signature: true,
    bot_prefix: "!",
    bot_authorized_users: [],
    page_url: "https://www.example.com",
    tip_url: "https://www.example.com/tip"
  },
  app: {
    first_run: true,
    ngrok_url: ""
  },
  subathon_config: {
    rates: [],
    currency: "EUR",
    history: [],
    donation_goals: [],
    uptime_goals: []
  },
  backup_info: {
    global_multiplier: 1,
    global_multiplier_countdown: 0,
    base_rate: 0,
    timer: 0,
    uptime: 0,
    donations: 0,
    donation_goal: 0
  }
}

export class DataManager {
  static getConfig(): Config {
    return globalData.config;
  }

  static getAppData(): AppData {
    return globalData.app;
  }

  static getSubathonConfig(): SubathonData {
    return globalData.subathon_config;
  }

  static setSubathonHistory(history: Event[]) {
    globalData.subathon_config.history = history;
    return globalData;
  }
  
  static getData(): Data {
    return globalData;
  }

  static async loadData() {
    Deno.mkdirSync("data", { recursive: true });

    // Load data/config.json
    try {
      const configData = Deno.readFileSync("data/config.json");
      const configText = new TextDecoder().decode(configData);
      const config: Config = JSON.parse(configText);
      
      globalData.config = config;
    } catch (_error) {
      Deno.writeFileSync("data/config.json", new TextEncoder().encode(JSON.stringify(globalData.config, null, 2)));
    }

    // Load data/data.json
    try {
      const appData = Deno.readFileSync("data/data.json");
      const appText = new TextDecoder().decode(appData);
      const app: AppData = JSON.parse(appText);
      
      globalData.app = app;
    } catch (_error) {
      Deno.writeFileSync("data/data.json", new TextEncoder().encode(JSON.stringify(globalData.app, null, 2)));
    }

    // Load data/subathon.json
    try {
      const subathonData = Deno.readFileSync("data/subathon.json");
      const subathonText = new TextDecoder().decode(subathonData);
      const subathon: SubathonData = JSON.parse(subathonText);
      
      globalData.subathon_config = subathon;
    } catch (_error) {
      Deno.writeFileSync("data/subathon.json", new TextEncoder().encode(JSON.stringify(globalData.subathon_config, null, 2)));
    }

    await this.saveData();
    await this.formatAllValues();
    return globalData;
  }
  
  static getClient() {
    return globalData.config.client;
  }

  static createFiles() {
    const files = [];
    // Create data directory
    Deno.mkdirSync("data", { recursive: true });

    // Create config.json if it doesn't exist
    try {
      Deno.readFileSync("data/config.json");
      files.push("config.json");
    } catch {
      Deno.writeFileSync("data/config.json", new TextEncoder().encode(""));
    }

    // Create data.json if it doesn't exist
    try {
      Deno.readFileSync("data/data.json");
      files.push("data.json");
    } catch {
      Deno.writeFileSync("data/data.json", new TextEncoder().encode(""));
    }

    // Create subathon.json if it doesn't exist
    try {
      Deno.readFileSync("data/subathon.json");
      files.push("subathon.json");
    } catch {
      Deno.writeFileSync("data/subathon.json", new TextEncoder().encode(""));
    }
    return files;
  }
  
  static saveData() {
    globalData.subathon_config.history = [];
    Deno.writeFileSync("data/config.json", new TextEncoder().encode(JSON.stringify(globalData.config, null, 2)));
    Deno.writeFileSync("data/data.json", new TextEncoder().encode(JSON.stringify(globalData.app, null, 2)));
    Deno.writeFileSync("data/subathon.json", new TextEncoder().encode(JSON.stringify(globalData.subathon_config, null, 2)));

    return globalData;
  }

  static parseValue(value: string) {
    const ngrokRegex = /\{NGROK_URL\}/g;
    return value.replace(ngrokRegex, `https://${globalData.app.ngrok_url}`);
  }

  static formatAllValues() {
    globalData.config.client.callback_url = DataManager.parseValue(globalData.config.client.callback_url);
    globalData.config.streamlabs_client.callback_url = DataManager.parseValue(globalData.config.streamlabs_client.callback_url);
    globalData.config.eventsub_callback = DataManager.parseValue(globalData.config.eventsub_callback);
    
    return globalData;
  }

  static saveBackup(data: Data) {
    Deno.mkdirSync("data/backups", { recursive: true });

    // DD-MM-YYYY-HH-MM-SS
    const backupName = new Date().toLocaleString().replace(/\/|,|:| /g, "-");
    Deno.writeFileSync(`data/backups/${backupName}.json`, new TextEncoder().encode(JSON.stringify(data, null, 2)));

    return backupName;
  }

  static loadBackup(backupName: string): Data {
    try {
      const backupData = Deno.readFileSync(`data/backups/${backupName}.json`);
      const backupText = new TextDecoder().decode(backupData);
      const backup: Data = JSON.parse(backupText);

      globalData.config = backup.config;
      globalData.app = backup.app;
      globalData.subathon_config = backup.subathon_config;
      globalData.backup_info = backup.backup_info;
      return globalData;
    } catch (_error) {
      return {
        config: globalData.config,
        app: globalData.app,
        subathon_config: globalData.subathon_config,
        backup_info: globalData.backup_info
      };
    }
  }

  static removeSensitiveValues(data: Data) {
    const newData: Data = JSON.parse(JSON.stringify(data));

    newData.config.secret_key = "";
    newData.config.client.secret = "";
    newData.config.streamlabs_client.secret = "";
    newData.subathon_config.history = [];

    return newData;
  }
}