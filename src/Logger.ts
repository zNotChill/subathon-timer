
export function Log(message: string, origin: string = "Logger") {
  console.log(`[${origin}] ${message}`);
}