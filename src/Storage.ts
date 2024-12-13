import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { SecretStore } from "https://deno.land/x/secret_store@v0.1.1/mod.ts";

const env = config();
const store = new SecretStore({ key: env.SECRET_KEY });

export class StorageManager {
  async get(key: string) {
    return await store.getItem(key) || "";
  }

  async set(key: string, value: string) {
    return await store.setItem(key, value);
  }

  async delete(key: string) {
    return await store.clear(key);
  }
}