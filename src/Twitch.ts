import { Config } from "./Data.ts";
import { User } from "./types/User.ts";
import { Log, Error } from "./Logger.ts";
import { SubscriptionType } from "./types/EventSub.ts";
import { SubathonManager } from "./Subathon.ts";

export class TwitchManager {
  access_token: string;
  refresh_token: string;
  code_access_token: string;
  code_refresh_token: string;
  config: Config;
  user: User;
  code_user: User;
  ws: WebSocket | null;

  logged_in: boolean;
  user_logged_in: boolean;

  subathonManager: SubathonManager;

  constructor(config: Config, subathonManager: SubathonManager) {
    this.config = config;

    this.access_token = "";
    this.refresh_token = "";
    this.code_access_token = "";
    this.code_refresh_token = "";
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

    this.logged_in = false;
    this.user_logged_in = false;

    this.subathonManager = subathonManager;
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
    this.refresh_token = data.refresh_token;

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

    return data;
  }

  async refreshToken(refresh_token: string) {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token
      })
    });

    const data = await response.json();
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

      this.triggerMessage(message);
    };

    this.ws.onclose = () => {
      Log(`WebSocket connection closed.`, "TwitchManager");
    };

    this.ws.onerror = (error) => {
      Error(`WebSocket error: ${error}`, "TwitchManager");
    };
  }

  // TODO: make this not type any
  // deno-lint-ignore no-explicit-any
  triggerMessage(message: any, from_websocket: boolean = true) {
    let event, eventType, sessionId, type;

    if (from_websocket) {
      event = message.payload.event;
      type = message.metadata.message_type;

      if (message.payload.subscription) {
        eventType = message.payload.subscription.type;
      }

      if (message.payload.session) {
        sessionId = message.payload.session.id;
      }

    } else {
      event = message.event;
      type = "notification"; // TODO: check if this impacts anything
      sessionId = message.subscription.id;
      eventType = message.subscription.type;
    }

    switch (type) {
      case "session_welcome": {
        Log(`Received session_welcome message. Subscribing to all events.`, "TwitchManager");
        
        this.subscribeToEvent(sessionId, "channel.cheer");
        this.subscribeToEvent(sessionId, "channel.follow");
        this.subscribeToEvent(sessionId, "channel.subscribe");
        
        break;
      }
      case "notification": {
        this.subathonManager.getRewardFromTwitchEvent(event, eventType);

        // switch (eventType as SubscriptionType) {
        //   case "channel.follow": {
        //     Log(`Received follow notification from ${event.user_login}.`, "TwitchManager");
        //     break;
        //   }
        //   case "channel.cheer": {
        //     Log(`Received bit donation from ${event.user_login}. Cheered ${event.bits} bits!`, "TwitchManager");
        //     break;
        //   }
        // }
        break;
      }
      default:
        // Log(`Received message of type ${type}. Message: ${message}`, "TwitchManager");
        break;
    }
  }

  async subscribeToEvent(sessionId: string, type: SubscriptionType = "channel.chat.message") {
    // Log(`Attempting to subscribe to eventsub of type ${type}.`, "TwitchManager");

    let version = "1";
    let condition = {};

    switch (type as SubscriptionType) {
      case "channel.follow": {
        version = "2";
        condition = {
          broadcaster_user_id: this.config.channel.id,
          moderator_user_id: this.code_user.user_id
        };
        break;
      }
      case "channel.cheer": {
        version = "1";
        condition = {
          broadcaster_user_id: this.config.channel.id
        }
        break;
      }
      case "channel.subscribe": {
        version = "1";
        condition = {
          broadcaster_user_id: this.config.channel.id
        }
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
      // Error("validateToken: Invalid token", "TwitchManager");
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

    this.logged_in = true;
  }
}