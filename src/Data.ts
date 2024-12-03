
export type Data = {
  config: Config
}

export type Config = {
  client: {
    id: string,
    secret: string,
    callback_url: string
  },
  port: number,
  api_base: "https://api.twitch.tv/helix",
  eventsub_url: "https://api.twitch.tv/helix/eventsub/subscriptions",
  secret_key: string,
  channel: {
    name: string,
    id: string
  }
}

export const globalData: Data = {
  config: {
    client: {
      id: "client_id",
      secret: "client_secret",
      callback_url: `http://localhost:8000/callback`
    },
    port: 8000,
    api_base: "https://api.twitch.tv/helix",
    eventsub_url: "https://api.twitch.tv/helix/eventsub/subscriptions",
    secret_key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    channel: {
      name: "channel_name",
      id: "channel_id"
    }
  }
}

export class DataManager {
  static getConfig(): Config {
    return globalData.config;
  }

  static loadData() {
    // Load data/config.json
    const configData = Deno.readFileSync("data/config.json");
    const configText = new TextDecoder().decode(configData);
    const config: Config = JSON.parse(configText);
    
    globalData.config = config;
  
    return globalData;
  }
  
  static getClient() {
    return globalData.config.client;
  }
  
}