
// config_change is an internal event
// used by the CLI to update the config
// and it also logs to the events in order
// to keep a comprehensive history of the
// subathon without weird/incorrect gaps
// in the data.

import { SubscriptionType } from "./EventSub.ts";

export type EventType = SubscriptionType | 
  "config_change" |
  "donation" |
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
  
  // whether the duration should be multiplied by the amount of bits/donations/viewers gained.
  // like adaptive, but simpler
  multiply?: boolean,

  // the amount of duration that should be added on top of the duration
  // per extra bit/donation/viewer gained
  adaptive_value?: number,
  donation_value?: number,
}

export type SubathonData = {
  rates: Rate[],
  currency: string, // no validation for now, I do not want to type out all the currencies
  history: Event[],
  donation_goals: DonationGoal[],
}

export type Event = {
  type: EventType,
  value: number,
  timestamp: number,
  rate: Rate,
  duration: number,
  donation: number,
  multiplier: number,
  user_id: string,
  user_name: string,
}

export type DonationGoal = {
  goal: number,
  title: string,
}