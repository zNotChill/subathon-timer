

import { Context } from "jsr:@oak/oak/context";
import { Log } from "./Logger.ts";
import { dataManager, twitchManager } from "./Manager.ts";
import { NgrokManager } from "./Ngrok.ts";
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Next } from "jsr:@oak/oak/middleware";
import ejs from "npm:ejs";

const app = new Application;

const router = new Router();
export const server = app;

const config = dataManager.getConfig();

const ngrokManager = new NgrokManager();
let https = "";

// authed middleware
const authMiddleware = async (ctx: Context, next: Next) => {
  const cookies = ctx.cookies;
  const access_token = await cookies.get("access_token");

  if (access_token !== twitchManager.code_access_token && twitchManager.user_logged_in) {
    ctx.response.status = 401;
    ctx.response.body = "Unauthorized";
    return;
  }

  return next();
};

router.get("/twitch/login", (ctx) => {
  const redirectUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${config.client.id}&redirect_uri=${config.client.callback_url}&response_type=code&scope=${config.client.scopes.join("%20")}`;
  ctx.response.redirect(redirectUrl);
});

router.get("/twitch/callback", authMiddleware, async (ctx) => {
  const params = ctx.request.url.searchParams;
  const code = params.get("code");
  const error = params.get("error");

  if (twitchManager.user_logged_in) {
    ctx.response.status = 400;
    ctx.response.body = "User already logged in";
    return;
  }

  if (error === "redirect_mismatch") {
    Log(`Redirect URI mismatch. Make sure to update your Twitch application's redirect URI to: ${https}/twitch/callback`, "Server");
  }

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

  if (
    (codeUser.login !== config.expected_user.name) &&
    (codeUser.user_id !== config.expected_user.id)
  ) {
    ctx.response.status = 403;
    ctx.response.body = "Unauthorized";
    return;
  }

  if (!codeToken.access_token) {
    ctx.response.status = 401;
    ctx.response.body = "Unauthorized";
    return;
  }

  twitchManager.code_access_token = codeToken.access_token;
  twitchManager.code_user = codeUser;
  twitchManager.user_logged_in = true;
  await twitchManager.connectWebSocket();

  Log(`User ${codeUser.login} has successfully logged in. Client ID now has requested permissions.`, "Server");

  ctx.cookies.set("logged_in", "true");
  ctx.cookies.set("access_token", codeToken.access_token);
  ctx.response.body = "OK";
});

router.post("/eventsub", async (ctx) => {
  if(!twitchManager.user_logged_in) return;
  const body = await ctx.request.body.json();
  const signature = ctx.request.headers.get("Twitch-Eventsub-Message-Signature") || "";
  const isValid = twitchManager.validateMessage(signature, config.secret_key);

  if (!isValid && config.verify_signature) {
    ctx.response.status = 401;
    ctx.response.body = "Invalid signature";
    return;
  }

  // console.log(body);
  twitchManager.triggerMessage(body, false)
  ctx.response.body = "OK";
});

/*
  Frontend System
*/

function getPageCSS(files: string[]) {
  const cssDir = `${import.meta.dirname}\\frontend\\css`;
  const cssFiles = files.map((file) => {
    return Deno.readTextFileSync(`${cssDir}\\${file}`);
  });

  return cssFiles.join("\n");
}

function getPageJS(files: string[]) {
  const jsDir = `${import.meta.dirname}\\frontend\\js`;
  
  const jsFiles = files.map((file) => {
    return Deno.readTextFileSync(`${jsDir}\\${file}`);
  });

  return jsFiles.join("\n");
}

router.get("/settings", authMiddleware, async (ctx) => {
  const cookies = ctx.cookies;
  const access_token = await cookies.get("access_token");

  const data = {
    user: twitchManager.code_user,
    data: dataManager.removeSensitiveValues(dataManager.getData()),
    css: getPageCSS(["Main.css"]),
    js: getPageJS(["Core.js", "Settings.js"]),
    access_token: access_token
  };

  const html = await ejs.renderFile(`${import.meta.dirname}\\frontend\\settings.ejs`, data);
  ctx.response.body = html;
});

app.use(router.routes());
app.listen({
  port: config.port,
});

// deno gets *VERY* angry if you underscore hostname
// deno-lint-ignore no-unused-vars
app.addEventListener("listen", async ({ hostname, port, secure }) => {
  Log(
    `Listening on: ${secure ? "https://" : "http://"}localhost:${port} | ${new Date().toLocaleString()}`,
    "Server"
  );

  // Start ngrok server
  if (config.use_ngrok) {
    Log(`Starting ngrok server...`, "Server");
    await ngrokManager.startNgrokServer();

    if (!ngrokManager.isStarted()) {
      Log(`Failed to start ngrok server.`, "Server");
      Log(`Exiting...`, "Server");
      Deno.exit(1);
    }
    
    https = `https://${ngrokManager.getUrl()}`
    Log(`Ngrok server ready at: ${https}`, "Server");
    Log(`The ngrok server will be used for all communications.`, "Server");

    Log(`Waiting for user to log in at ${https}/twitch/login...`, "Server");
  } else {
    Log(`Waiting for user to log in...`, "Server");
  }
});
