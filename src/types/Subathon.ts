
// config_change is an internal event
// used by the CLI to update the config
// and it also logs to the events in order
// to keep a comprehensive history of the
// subathon without weird/incorrect gaps
// in the data.

import { SubscriptionType } from "./EventSub.ts";
import { HelixUser } from "./Helix.ts";

export type EventType = SubscriptionType | 
  "config_change" |
  "donation" |
  "raid" |
  "money_added" |
  "money_removed" |
  "time_added" |
  "time_removed" |
  "time_reset" |
  "time_paused" |
  "time_unpaused";

export type Rate = {
  value: number,
  duration: number,
  type: EventType,

  // whether the amount should adapt to the
  // actual amount of money/viewers gained from bits/donations/raids
  adaptive?: boolean,
  
  // the operation that should be done on the value
  // when the rate is adaptive
  operation: "add" | "subtract" | "multiply" | "divide" | "set",

  // the amount of duration that should be added on top of the duration
  // per extra bit/donation/viewer gained
  time_per: number,
  money_per: number,
}

export type SubathonData = {
  rates: Rate[],
  currency: string, // no validation for now, I do not want to type out all the currencies
  history: Event[],
  donation_goals: DonationGoal[],
  uptime_goals: UptimeGoal[],
}

export type Event = {
  type: EventType,
  value: number,
  timestamp: number,
  rate: Rate,
  duration: number,
  donation: number,
  multiplier: number,
  base_rate: number,
  user_id: string,
  user_name: string,
  helix_user: HelixUser,
  tier?: number,
}

export type DonationGoal = {
  goal: number,
  title: string,
}

export type UptimeGoal = {
  goal: number,
  title: string,
}