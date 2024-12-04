import { Config, DataManager } from "./Data.ts";
import { User } from "./types/User.ts";
import { server } from "./Server.ts";
import { Log, Error } from "./Logger.ts";
import { SubscriptionType } from "./types/EventSub.ts";

export class TwitchManager {
  access_token: string;
  code_access_token: string;
  config: Config;
  user: User;
  code_user: User;
  ws: WebSocket | null;

  constructor(config: Config) {
    this.config = config;

    this.access_token = "";
    this.code_access_token = "";
    this.ws = null;

    this.user = {
      client_id: "",
      login: "",
      scopes: [],
      user_id: "",
      expires_in: 0
    };

    this.code_user = {
      client_id: "",
      login: "",
      scopes: [],
      user_id: "",
      expires_in: 0
    };
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
        scope: this.config.client.scopes.join(" ")
      })
    })

    const data = await response.json();
    this.access_token = data.access_token;

    return data;
  }

  async getAccessTokenFromCode(code: string) {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: this.config.client.id,
        client_secret: this.config.client.secret,
        grant_type: "authorization_code",
        redirect_uri: this.config.client.callback_url,
        code
      })
    });

    const data = await response.json();
    this.code_access_token = data.access_token;

    return data;
  }

  connectWebSocket() {
    Log(`Connecting to EventSub WebSocket.`, "TwitchManager");

    this.ws = new WebSocket("wss://eventsub.wss.twitch.tv/ws");

    this.ws.onopen = () => {
      Log(`WebSocket connection opened.`, "TwitchManager");
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const type = message.metadata.message_type;

      switch (type) {
        case "session_welcome": {
          Log(`Received session_welcome message. Subscribing to all events.`, "TwitchManager");
          this.subscribeToEvent(message.payload.session.id, "channel.follow");
          break;
        }
        case "notification": {
          const event = message.payload.event;
          switch (message.payload.subscription.type) {
            case "channel.follow": {
              Log(`Received follow notification from ${event.user_login}.`, "TwitchManager");
              break;
            }
          }
          break;
        }
        default:
          Log(`Received message of type ${type}. Message: ${message}`, "TwitchManager");
          break;
      }
    };

    this.ws.onclose = () => {
      Log(`WebSocket connection closed.`, "TwitchManager");
    };

    this.ws.onerror = (error) => {
      Error(`WebSocket error: ${error}`, "TwitchManager");
    };
  }

  async subscribeToEvent(sessionId: string, type: SubscriptionType = "channel.chat.message") {
    Log(`Attempting to subscribe to eventsub of type ${type}.`, "TwitchManager");

    let version = "1";
    let condition = {};

    switch (type) {
      case "channel.follow": {
        version = "2";
        condition = {
          broadcaster_user_id: this.config.channel.id,
          moderator_user_id: this.code_user.user_id
        };
      }
    }

    const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      method: "POST",
      headers: {
        "Client-ID": this.config.client.id,
        "Authorization": `Bearer ${this.code_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: type,
        version: version,
        condition: condition,
        transport: {
          method: "websocket",
          session_id: sessionId
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      Error(`subscribeToEvent: Failed to subscribe to eventsub of type ${type} - ${data.message}`, "TwitchManager");
      return data;
    }

    Log(`Successfully subscribed to eventsub of type ${type}.`, "TwitchManager");
    return data;
  }

  async validateToken(token: string, type: string = "OAuth") {
    const response = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        "Authorization": `${type} ${token}`
      }
    });

    const data = await response.json();

    if (data.status === 401) {
      Error("validateToken: Invalid token", "TwitchManager");
      return "Invalid token";
    }
    
    return data;
  }

  validateMessage(signature: string, secret: string) {
    const crypto = new TextEncoder();
    const hmac = crypto.encode(secret);
    return signature === `sha256=${hmac}`;
  }

  async main() {
    await this.getAccessToken();
    await this.validateToken(this.access_token);

    server;
  }
}

DataManager.loadData();

export const twitchManager = new TwitchManager(DataManager.getConfig());
twitchManager.main();