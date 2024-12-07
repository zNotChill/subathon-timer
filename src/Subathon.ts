
import { SubscriptionType } from "./types/EventSub.ts";
import { MessageEvent } from "./types/EventSub.ts";

// config_change is an internal event
// used by the CLI to update the config
// and it also logs to the events in order
// to keep a comprehensive history of the
// subathon without weird/incorrect gaps
// in the data.

export type EventType = SubscriptionType | "config_change" | "donation";

export type Rate = {
  value: number,
  duration: number,
  type: EventType,

  // whether the amount should adapt to the
  // actual amount of money/viewers gained from bits/donations/raids
  adaptive?: boolean,
}

export type SubathonData = {
  rates: Rate[],
  currency: string, // no validation for now, I do not want to type out all the currencies
}

export type Event = {
  type: EventType,
  value: number,
  timestamp: number,
  rate: Rate,
}

export class SubathonManager {
  data: SubathonData;
  sessionHistory: Event[];
  globalMultiplier: number;

  constructor(data: SubathonData) {
    this.data = data;
    this.sessionHistory = [];
    this.globalMultiplier = 1;
  }

  addEvent(event: Event) {
    this.sessionHistory.push(event);
  }

  getEvents() {
    return this.sessionHistory;
  }

  getRates() {
    return this.data.rates;
  }

  getCurrency() {
    return this.data.currency;
  }

  getRate(type: EventType) {
    return this.data.rates.find(rate => rate.type === type);
  }

  setGlobalMultiplier(multiplier: number) {
    this.globalMultiplier = multiplier;
  }

  getRewardFromTwitchEvent(event: MessageEvent, type: SubscriptionType) {
    const rate = this.getRate(type);
    switch (type) {
      case "channel.cheer":
        
    }
  }
}