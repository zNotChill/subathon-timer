import { Config, DataManager } from "./Data.ts";
import { serve } from "https://deno.land/std@0.118.0/http/server.ts";

export class TwitchManager {
  access_token: string;
  config: Config;
  user: object;

  constructor(config: Config) {
    this.config = config;

    this.access_token = "";
    this.user = {};
  }

  async getAccessToken() {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: this.config.client.id,
        client_secret: this.config.client.secret,
        grant_type: "client_credentials",
        scope: [
          "channel:read:subscriptions",
          "channel:manage:broadcast",
          "channel:manage:polls",
          "channel:manage:predictions",
          "channel:manage:redemptions",
          "channel:manage:schedule",
          "channel:manage:videos",
        ].join(" ")
      })
    })

    const data = await response.json();
    this.access_token = data.access_token;
  }

  async subscribeToEvent() {
    const response = await fetch(this.config.eventsub_url, {
      method: "POST",
      headers: {
        "Client-ID": this.config.client.id,
        "Authorization": `Bearer ${this.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "channel.chat.message",
        version: "1",
        condition: {
          user_id: this.config.channel.id,
          broadcaster_user_id: this.config.channel.id
        },
        transport: {
          method: "webhook",
          callback: this.config.client.callback_url,
          secret: this.config.secret_key
        }
      })
    });

    const data = await response.json();
    console.log(data);
  }

  async getUserFromAccessToken() {
    try {
      const response = await fetch(`${this.config.api_base}/users`, {
        headers: {
          "Client-ID": this.config.client.id,
          "Authorization": `Bearer ${this.access_token}`
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error fetching user: ${errorData.message} (Status: ${response.status})`);
        return;
      }
  
      const data = await response.json();
      console.log(data);
  
      return data;
    } catch (error) {
      console.error(`Failed to fetch user: ${error}`);
    }
  }

  validateMessage(message: string, signature: string, secret: string) {
    const crypto = new TextEncoder();
    const hmac = crypto.encode(secret);
    return signature === `sha256=${hmac}`;
  }

  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/eventsub" && req.method === "POST") {
      const body = await req.text();
      const signature = req.headers.get("Twitch-Eventsub-Message-Signature") || "";
      const isValid = this.validateMessage(body, signature, this.config.secret_key);

      if (!isValid) {
        return new Response("Invalid signature", { status: 401 });
      }

      const event = JSON.parse(body);
      console.log(event);

      return new Response("OK");
    }

    return new Response("OK");
  }

  async main() {
    await this.getAccessToken();
    await this.getUserFromAccessToken()
    await this.subscribeToEvent();
    serve(this.handleRequest);
  }
}

async function main() {
  DataManager.loadData();
  
  const twitchManager = new TwitchManager(DataManager.getConfig());

  twitchManager.main();
}

main();