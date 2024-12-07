
import { AppData, Config, DataManager } from "./Data.ts";
import { mergeReadableStreams } from "jsr:/@std/streams@^1.0.8/merge-readable-streams";
import { TextLineStream } from "jsr:/@std/streams@^1.0.8/text-line-stream";

const config: Config = DataManager.getConfig();
const appdata: AppData = DataManager.getAppData();

export type NgrokOptions = {
  protocol: string;
  port: number;
};

export class NgrokManager {
  url: string;
  started: boolean;

  constructor() {
    this.url = "";
    this.started = false;
  }

  async startNgrokServer() {
    const tunnel = await this.connect({
      protocol: "http",
      port: config.port
    }).next();

    if (tunnel.value === "EXIT") {
      throw new Error("Ngrok exited unexpectedly. Possibly your URL is wrong or already in use.");
    }

    if (typeof tunnel.value === "string") {
      this.url = tunnel.value;
    } else {
      throw new Error("Failed to start Ngrok server.");
    }
    this.started = true;
  }

  isStarted() {
    return this.started;
  }

  getUrl() {
    return this.url;
  }

  version(): string {
    const process = new Deno.Command("ngrok", {
      args: ["version"],
      stdout: "piped",
      stderr: "piped",
    }).outputSync();
    return new TextDecoder().decode(process.stdout).trim();
  }

  async* connect(options: NgrokOptions): AsyncGenerator<string, void, unknown> {
    const args = [
      options.protocol,
      options.port.toString(),
      "--log=stdout",
      "--scheme=http",
      `--url=${appdata.ngrok_url}`
    ];
    
    const process = new Deno.Command("ngrok", {
      args: args,
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    process.stdin?.close();
    const output = mergeReadableStreams(process.stdout, process.stderr)
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());

    const ready = /started tunnel.*:\/\/(.*)/;

    for await (const line of output) {
      const connected = line.match(ready);
      if (connected) {
        yield connected[1] as string;
      }
    }

    yield "EXIT";
  }
}