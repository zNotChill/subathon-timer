
export function Log(message: string, origin: string = "Logger") {
  console.log(`[${origin}] ${message}`);
}

export function Error(message: string, origin: string = "Logger") {
  console.error(`[${origin}] ${message}`);
}