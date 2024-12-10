import { Event, SubathonData } from "./Subathon.ts";

export type Data = {
  config: Config,
  app: AppData,
  subathon_config: SubathonData,
}

export type Config = {
  client: {
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
  use_ngrok: boolean,
  backup_frequency: number,
  verify_signature: boolean
}

export type AppData = {
  first_run: boolean,
  ngrok_url: string,
  access_token: string,
  refresh_token: string,
}

export const globalData: Data = {
  config: {
    client: {
      id: "client_id",
      secret: "client_secret",
      callback_url: `{NGROK_URL}/twitch/callback`,
      scopes: [
        "channel:read:redemptions",
        "channel:manage:redemptions",
        "channel:moderate",
        "channel:read:subscriptions"
      ]
    },
    port: 4450,
    api_base: "https://api.twitch.tv/helix",
    eventsub_url: "https://api.twitch.tv/helix/eventsub/subscriptions",
    eventsub_callback: "{NGROK_URL}/eventsub",
    secret_key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    channel: {
      name: "channel_name",
      id: "channel_id"
    },
    expected_user: {
      name: "expected_user_name",
      id: "expected_user_id"
    },
    use_ngrok: true,
    backup_frequency: 60,
    verify_signature: true
  },
  app: {
    first_run: true,
    ngrok_url: "",
    access_token: "",
    refresh_token: ""
  },
  subathon_config: {
    rates: [
      {
        duration: 4,
        type: "donation",
        value: 1,
        adaptive: true
      },
      {
        duration: 4,
        type: "channel.cheer",
        value: 100,
        adaptive: true
      },
      {
        duration: 8,
        type: "channel.cheer",
        value: 200,
        adaptive: true
      },
      {
        duration: 15,
        type: "channel.subscribe",
        value: 1
      },
      {
        duration: 30,
        type: "channel.subscribe",
        value: 2
      },
      {
        duration: 60,
        type: "channel.subscribe",
        value: 3
      },
    ],
    currency: "EUR",
    history: [],
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

  static loadData() {
    this.createFiles();
    // Load data/config.json
    const configData = Deno.readFileSync("data/config.json");
    const configText = new TextDecoder().decode(configData);
    const config: Config = JSON.parse(configText);
    
    globalData.config = config;

    // Load data/data.json
    const appData = Deno.readFileSync("data/data.json");
    const appText = new TextDecoder().decode(appData);
    const app: AppData = JSON.parse(appText);

    globalData.app = app;

    // Load data/subathon.json
    const subathonData = Deno.readFileSync("data/subathon.json");
    const subathonText = new TextDecoder().decode(subathonData);
    const subathon: SubathonData = JSON.parse(subathonText);

    globalData.subathon_config = subathon;

    this.formatAllValues();
    return globalData;
  }
  
  static getClient() {
    return globalData.config.client;
  }

  static createFiles() {
    // Create data directory
    Deno.mkdirSync("data", { recursive: true });

    // Create config.json if it doesn't exist
    try {
      Deno.readFileSync("data/config.json");
    } catch {
      Deno.writeFileSync("data/config.json", new TextEncoder().encode(""));
    }

    // Create data.json if it doesn't exist
    try {
      Deno.readFileSync("data/data.json");
    } catch {
      Deno.writeFileSync("data/data.json", new TextEncoder().encode(""));
    }

    // Create subathon.json if it doesn't exist
    try {
      Deno.readFileSync("data/subathon.json");
    } catch {
      Deno.writeFileSync("data/subathon.json", new TextEncoder().encode(""));
    }

    return globalData;
  }
  
  static saveData() {
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

  static removeSensitiveValues(data: Data) {
    const newData = data;

    newData.app.access_token = "";
    newData.app.refresh_token = "";
    newData.config.secret_key = "";
    newData.config.client.secret = "";

    return newData;
  }
}