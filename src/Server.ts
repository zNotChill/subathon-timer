

import { DataManager } from "./Data.ts";
import { Log } from "./Logger.ts";
import { twitchManager } from "./Twitch.ts";
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";

const app = new Application;

const router = new Router();
export const server = app;

DataManager.loadData();
const config = DataManager.getConfig();

router.get("/twitch/login", (ctx) => {
  const redirectUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${config.client.id}&redirect_uri=${config.client.callback_url}&response_type=code&scope=${config.client.scopes.join("%20")}`;
  ctx.response.redirect(redirectUrl);
});

router.get("/twitch/callback", async (ctx) => {
  const params = ctx.request.url.searchParams;
  const code = params.get("code");

  if (!code) {
    ctx.response.status = 400;
    ctx.response.body = "No code provided";
    return;
  }

  const codeToken = await twitchManager.getAccessTokenFromCode(code);
  const codeUser = await twitchManager.validateToken(codeToken.access_token, "Bearer");

  if (codeUser === "Invalid token") {
    ctx.response.status = 401;
    ctx.response.body = "Invalid token";
    return;
  }

  twitchManager.code_user = codeUser;

  Log(`User ${codeUser.login} has successfully logged in. Client ID now has requested permissions.`, "Server");

  await twitchManager.connectWebSocket();

  ctx.response.body = "OK";
});

router.post("/eventsub", async (ctx) => {
  const body = await ctx.request.body.json();
  const signature = ctx.request.headers.get("Twitch-Eventsub-Message-Signature") || "";
  const isValid = twitchManager.validateMessage(signature, config.secret_key);

  if (!isValid) {
    ctx.response.status = 401;
    ctx.response.body = "Invalid signature";
    return;
  }

  const event = body;
  console.log(event);

  ctx.response.body = "OK";
});

app.use(router.routes());
app.listen({
  port: config.port,
});

app.addEventListener("listen", ({ hostname, port, secure }) => {
  Log(
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ?? "localhost"
    }:${port} | ${new Date().toLocaleString()}`,
    "Server"
  );
  Log(`This console is safe to show/share.`, "Server");
  Log(`Waiting for user to log in...`, "Server");
});
