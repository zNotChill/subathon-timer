import io, { Socket } from "npm:socket.io-client";
import { Log } from "./Logger.ts";
import { Error } from "./Logger.ts";
import { dataManager, subathonManager } from "./Manager.ts";
import { Data } from "./Data.ts";
import { StreamlabsEvent } from "./types/Streamlabs.ts";

export class StreamlabsManager {
  access_token: string;
  data: Data;
  logged_in: boolean;
  io: Socket;

  socket_token: string;

  constructor() {
    this.access_token = "";
    this.data = dataManager.getData();
    this.logged_in = false;
    this.io = io();

    this.socket_token = "";
  }

  async getAccessToken(code: string) {
    try {
      const response = await fetch("https://streamlabs.com/api/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: this.data.config.streamlabs_client.id,
          client_secret: this.data.config.streamlabs_client.secret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: this.data.config.streamlabs_client.callback_url
        })
      });
  
      const data = await response.json();
      
      this.access_token = data.access_token;
      return data;
    } catch (error) {
      Error(`Error while getting access token: ${error}`, "StreamlabsManager");
    }
  }

  async testDonation(amount: number = 1) {
    try {
      const response = await fetch("https://streamlabs.com/api/v2.0/donations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.access_token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          name: "Test Donation",
          message: "This is a test donation",
          identifier: "test",
          amount: `${amount}`,
          currency: "EUR"
        })
      });
  
      return response.json();
    } catch (error) {
      Error(`Error while testing donation: ${error}`, "StreamlabsManager");
    }
  }

  async getSocketToken() {
    try {
      if (this.access_token === "") {
        return;
      }
  
      const response = await fetch("https://streamlabs.com/api/v2.0/socket/token", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.access_token}`,
          "accept": "application/json"
        }
      });
  
      return response.json();
    } catch (error) {
      Error(`Error while getting socket token: ${error}`, "StreamlabsManager");
    }
  }

  async main() {
    this.socket_token = (await this.getSocketToken())["socket_token"];
    this.connect();
  }

  connect() {
    this.io = io("https://sockets.streamlabs.com?token=" + this.socket_token, {
      transports: ["websocket"]
    });

    this.io.on("connect", () => {
      Log(`Connected to Streamlabs socket`, "StreamlabsManager");

      // Log(`Running test donation`, "StreamlabsManager");
      // this.testDonation(500).then(() => {});
    })

    this.io.on("event", (data: StreamlabsEvent) => {
      switch (data.type) {
        case "donation": {
          try {
            // if (data.message[0].name === "Test Donation") {
              // return;
            // }
            subathonManager.getRewardFromTwitchEvent({
              user_id: "0",
              user_login: data.message[0].name,
              user_name: data.message[0].name,
              broadcaster_user_id: this.data.config.channel.id,
              broadcaster_user_name: this.data.config.channel.name,
              broadcaster_user_login: this.data.config.channel.name,
              is_anonymous: true,
              amount: parseFloat(data.message[0].amount),
            }, "donation");
          } catch (error) {
            Error(`Error while processing donation: ${error}`, "StreamlabsManager");
          }
          break;
        }
      }
    });
  }
}