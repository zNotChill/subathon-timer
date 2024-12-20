

import { Context } from "jsr:@oak/oak/context";
import { Log } from "./Logger.ts";
import { botManager, dataManager, storageManager, streamlabsManager, subathonManager, twitchManager } from "./Manager.ts";
import { NgrokManager } from "./Ngrok.ts";
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Next } from "jsr:@oak/oak/middleware";
import ejs from "npm:ejs";
import { preventBacktrack } from "./utils/Path.ts";
import { commands } from "./Bot.ts";

const app = new Application;

const router = new Router();
export const server = app;

const globalData = dataManager.getData();

const ngrokManager = new NgrokManager();
let https = "";

export let authOverride: boolean = false;

export function setAuthOverride(value: boolean) {
  authOverride = value;
}

// authed middleware
const authMiddleware = async (ctx: Context, next: Next) => {
  const cookies = ctx.cookies;
  let access_token = await cookies.get("access_token");
  const refresh_token = await cookies.get("refresh_token");

  // if the refresh token matches the current refresh token
  // but the access token doesn't, we need to set the access token to the new one
  if (access_token !== twitchManager.code_access_token && refresh_token === twitchManager.refresh_token) {
    access_token = twitchManager.code_access_token;
    ctx.cookies.set("access_token", access_token);
  }

  if (access_token !== twitchManager.code_access_token && twitchManager.user_logged_in) {
    ctx.response.status = 401;
    ctx.response.body = "Unauthorized";
    return;
  }

  return next();
};

router.get("/twitch/login", (ctx) => {
  const redirectUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${globalData.config.client.id}&redirect_uri=${globalData.config.client.callback_url}&response_type=code&scope=${globalData.config.client.scopes.join("%20")}`;
  ctx.response.redirect(redirectUrl);
});

router.get("/twitch/bot/login", (ctx) => {
  const redirectUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${globalData.config.client.id}&redirect_uri=${globalData.config.client.bot_callback_url}&response_type=code&scope=${globalData.config.client.scopes.join("%20")}`;
  ctx.response.redirect(redirectUrl);
});

router.get("/streamlabs/login", (ctx) => {
  const redirectUrl = `https://streamlabs.com/api/v2.0/authorize?client_id=${globalData.config.streamlabs_client.id}&redirect_uri=${globalData.config.streamlabs_client.callback_url}&response_type=code&scope=${globalData.config.streamlabs_client.scopes.join("%20")}`;
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
    (
      (codeUser.login !== globalData.config.expected_user.name) &&
      (codeUser.user_id !== globalData.config.expected_user.id) // this is the user that the program expects to be logged in, and is an admin
    )
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

  storageManager.set("access_token", codeToken.access_token);
  storageManager.set("refresh_token", codeToken.refresh_token);
  dataManager.saveData();

  await twitchManager.connectWebSocket();

  Log(`User ${codeUser.login} has successfully logged in. Client ID now has requested permissions.`, "Server");

  ctx.cookies.set("logged_in", "true");
  ctx.cookies.set("access_token", codeToken.access_token);
  ctx.cookies.set("refresh_token", codeToken.refresh_token);
  ctx.response.body = "OK";
});

router.get("/streamlabs/callback", authMiddleware, async (ctx) => {
  const params = ctx.request.url.searchParams;
  const code = params.get("code");
  const error = params.get("error");

  if (streamlabsManager.logged_in) {
    ctx.response.status = 400;
    ctx.response.body = "User already logged in";
    return;
  }

  if (error === "redirect_mismatch") {
    Log(`Redirect URI mismatch. Make sure to update your Streamlabs application's redirect URI to: ${https}/streamlabs/callback`, "Server");
  }

  if (!code) {
    ctx.response.status = 400;
    ctx.response.body = "No code provided";
    return;
  }

  const codeToken = await streamlabsManager.getAccessToken(code);
  twitchManager.logged_in = true;

  if (!codeToken.access_token) {
    ctx.response.status = 401;
    ctx.response.body = "Unauthorized";
    return;
  }

  Log(`Streamlabs user has successfully logged in. Client ID now has requested permissions.`, "Server");

  storageManager.set("streamlabs_access_token", codeToken.access_token);
  dataManager.saveData();

  await streamlabsManager.main();
  ctx.cookies.set("streamlabs_logged_in", "true");
  ctx.cookies.set("streamlabs_access_token", codeToken.access_token);
  ctx.response.body = "OK";
});


router.get("/twitch/bot/callback", async (ctx) => {
  const params = ctx.request.url.searchParams;
  const code = params.get("code");
  const error = params.get("error");

  if (botManager.logged_in) {
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
    (codeUser.login !== globalData.config.bot_user.name) &&
    (codeUser.user_id !== globalData.config.bot_user.id)
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

  botManager.logged_in = true;

  storageManager.set("bot_access_token", codeToken.access_token);
  storageManager.set("bot_refresh_token", codeToken.refresh_token);
  dataManager.saveData();

  await twitchManager.connectWebSocket();

  Log(`Bot user ${codeUser.login} has successfully logged in.`, "Server");

  await botManager.start();
  ctx.cookies.set("logged_in", "true");
  ctx.cookies.set("bot_access_token", codeToken.access_token);
  ctx.response.body = "OK";
});

router.post("/eventsub", async (ctx) => {
  if(!twitchManager.user_logged_in) return;
  const body = await ctx.request.body.json();
  const signature = ctx.request.headers.get("Twitch-Eventsub-Message-Signature") || "";
  const isValid = twitchManager.validateMessage(signature, globalData.config.secret_key);

  if (!isValid && globalData.config.verify_signature) {
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
    access_token: access_token,
    authenticated: true,
  };

  const html = await ejs.renderFile(`${import.meta.dirname}\\frontend\\settings.ejs`, data);
  ctx.response.body = html;
});

router.get("/commands", async (ctx) => {
  const cookies = ctx.cookies;
  const access_token = await cookies.get("access_token");
  
  const data = {
    user: twitchManager.code_user,
    data: dataManager.removeSensitiveValues(dataManager.getData()),
    css: getPageCSS(["Main.css"]),
    js: getPageJS(["Core.js", "Commands.js"]),
    access_token: access_token,
    authenticated: twitchManager.code_access_token === access_token,
    commands: {
      prefix: globalData.config.bot_prefix,
      commands: Array.from(commands.values()),
    }
  };

  const html = await ejs.renderFile(`${import.meta.dirname}\\frontend\\commands.ejs`, data);
  ctx.response.body = html;
})

/* 
  Elements Page
*/

router.get("/element", async (ctx) => {
  const element = ctx.request.url.searchParams.get("s");;
  
  // check {import.meta.dirname}\\frontend\\elements\\${element}.globalData.config.json
  // if it exists, render the element
  // else, return 404
  
  const elementConfig = preventBacktrack(`${import.meta.dirname}\\frontend\\elements\\${element}.config.json`);
  const elementRender = preventBacktrack(`${import.meta.dirname}\\frontend\\elements\\${element}.ejs`);
  let data = {};
  
  try {
    data = JSON.parse(Deno.readTextFileSync(elementConfig));
  } catch (e) {
    if (e instanceof SyntaxError) {
      ctx.response.status = 400;
      ctx.response.body = "Config contains invalid JSON";
      return;
    }
    
    ctx.response.status = 404;
    ctx.response.body = "Element not found";
    return;
  }

  
  // if the object is {}, return 404
  if (Object.keys(data).length === 0) {
    ctx.response.status = 404;
    ctx.response.body = "Element not found";
    return;
  }

  // render the element

  const renderData = {
    data: data,
    css: getPageCSS(["Main.css"]),
    js: getPageJS([
      "Core.js",
      "Elements.js"
    ]),
    info: subathonManager.getRelevantInfo(),
  };

  const html = await ejs.renderFile(elementRender, renderData);
  ctx.response.body = html;
})

/*
  API
*/

router.get("/api/timer", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = subathonManager.getRelevantInfo();
});

router.get("/api/commands", (ctx) => {
  const commandsArray = Array.from(commands.values());

  ctx.response.status = 200;
  ctx.response.body = {
    prefix: globalData.config.bot_prefix,
    commands: commandsArray,
  };
});

router.post("/api/timer", async (ctx) => {
});

app.use(router.routes());
app.listen({
  port: globalData.config.port,
});

// deno gets *VERY* angry if you underscore hostname
// deno-lint-ignore no-unused-vars
app.addEventListener("listen", async ({ hostname, port, secure }) => {
  Log(
    `Listening on: ${secure ? "https://" : "http://"}localhost:${port} | ${new Date().toLocaleString()}`,
    "Server"
  );

  https = `http://localhost:${port}`;
  // Start ngrok server
  if (globalData.config.use_ngrok) {
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
  }

  // console.log(await storageManager.get("access_token"));
  // console.log(await storageManager.get("refresh_token"));
  // console.log(await storageManager.get("streamlabs_access_token"));
  
  if (
    await storageManager.get("access_token") &&
    await storageManager.get("refresh_token") &&
    await storageManager.get("streamlabs_access_token") &&
    !authOverride
  ) {
    Log(`User logged in.`, "Server");
    Log(`Streamlabs user logged in.`, "Server");
    Log(`All services are running.`, "Server");

    streamlabsManager.access_token = await storageManager.get("streamlabs_access_token");
    twitchManager.code_access_token = await storageManager.get("access_token");
    twitchManager.code_user = await twitchManager.validateToken(twitchManager.code_access_token, "Bearer");
    twitchManager.user_logged_in = true;

    await subathonManager.main();
    const refresh_data = await twitchManager.refreshAccessToken(await storageManager.get("refresh_token"));
    const bot_refresh_data = await twitchManager.refreshAccessToken(await storageManager.get("bot_refresh_token"));

    twitchManager.access_token = refresh_data.access_token;
    twitchManager.refresh_token = refresh_data.refresh_token;
    storageManager.set("access_token", refresh_data.access_token);
    storageManager.set("refresh_token", refresh_data.refresh_token);

    storageManager.set("bot_access_token", bot_refresh_data.access_token);
    storageManager.set("bot_refresh_token", bot_refresh_data.refresh_token);
    await dataManager.saveData();
    
    await twitchManager.connectWebSocket();
    await streamlabsManager.main();

    await botManager.start();
  } else {
    Log(`Waiting for user to log in at ${https}/streamlabs/login...`, "Server");
    Log(`Waiting for user to log in at ${https}/twitch/login...`, "Server");
    Log(`Waiting for user to log in at ${https}/twitch/bot/login...`, "Server");

    for (let i = 0; i < 3; i++) {
      Log(`Once you have logged in on all, restart the program.`, "Server");
    }
  }
});
