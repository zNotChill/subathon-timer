import { Config } from "./Data.ts";
import io, { Socket } from "npm:socket.io-client";

export class StreamlabsManager {
  access_token: string;
  config: Config;
  logged_in: boolean;
  io: Socket;

  constructor(config: Config) {
    this.access_token = "";
    this.config = config;
    this.logged_in = false;
    this.io = io();
  }

  async getAccessToken(code: string) {
    const response = await fetch("https://streamlabs.com/api/v2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: this.config.streamlabs_client.id,
        client_secret: this.config.streamlabs_client.secret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: this.config.streamlabs_client.callback_url
      })
    });

    const data = await response.json();
    this.access_token = data.access_token;
    return data;
  }

  async testDonation(amount: number = 1) {
    const form = new FormData();

    form.append("name", "Test Donation");
    form.append("message", "This is a test donation");
    form.append("identifier", "test");
    form.append("amount", `${amount}`);
    form.append("currency", "EUR");

    const response = await fetch("https://streamlabs.com/api/v2.0/donations", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form
    });

    return response.json();
  }

  async getSocketToken() {
    if (this.access_token === "") {
      return;
    }

    const response = await fetch("https://streamlabs.com/api/v1.0/socket/token", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.access_token}`,
        "accept": "application/json"
      }
    });

    return response.json();
  }

  async main() {
    console.log(this.access_token);
    console.log(await this.getSocketToken());
    
    // this.socket_token = await this.getSocketToken();
    // this.io = io("https://sockets.streamlabs.com?token=" + this.socket_token);
  }
}