import { Log } from "./Logger.ts";
import { dataManager } from "./Manager.ts";
import { SubscriptionType } from "./types/EventSub.ts";
import { MessageEvent } from "./types/EventSub.ts";

// config_change is an internal event
// used by the CLI to update the config
// and it also logs to the events in order
// to keep a comprehensive history of the
// subathon without weird/incorrect gaps
// in the data.

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

export class SubathonManager {
  data: SubathonData;
  sessionHistory: Event[];
  globalMultiplier: number;

  timer: number;
  donations: number;
  donation_goal: number;
  
  timer_paused: boolean;
  timer_paused_at: number;

  constructor(data: SubathonData) {
    this.data = data;
    this.sessionHistory = [];
    this.globalMultiplier = 1;

    this.timer = 600; // 10 mins by default, should this be configurable?
    this.donations = 0;
    this.donation_goal = 0;

    this.timer_paused = false;
    this.timer_paused_at = 0;
  }

  addEvent(event: Event) {
    this.sessionHistory.push(event);

    dataManager.setSubathonHistory(this.sessionHistory);
  }

  getEvents() {
    return this.sessionHistory;
  }

  getMostRecentEvent() {
    return this.sessionHistory[this.sessionHistory.length - 1];
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

  getAllRatesFromType(type: EventType) {
    return this.data.rates.filter(rate => rate.type === type);
  }

  getTimer() {
    return this.timer;
  }

  setGlobalMultiplier(multiplier: number) {
    this.globalMultiplier = multiplier;
  }

  getMessageEventValue(event: MessageEvent, type: SubscriptionType) {
    let eventValue: number = 0;

    switch (type) {
      case "channel.cheer":
        eventValue = event.bits ?? 0;
        break;
      case "channel.subscribe":
        eventValue = 1;
        break;
    }

    return eventValue;
  }

  // This method is way easier than relying on a timer
  // and it's more accurate. It also allows for more
  // flexibility in the future.
  setTimerFromHistory() {
    let duration = 0;

    this.sessionHistory.forEach(event => {
      duration += event.duration * event.multiplier;
    });

    this.timer = duration;
  }

  setDonationsFromHistory() {
    let donations = 0;

    this.sessionHistory.forEach(event => {
      if (event.type === "channel.cheer") {
        donations += event.donation;
      }
    });

    this.donations = donations;
  }

  getRewardFromTwitchEvent(event: MessageEvent, type: SubscriptionType) {
    const eventValue: number = this.getMessageEventValue(event, type);

    const rates = this.getAllRatesFromType(type);
    let usedRate: Rate = rates[0];

    // Decide which rate to use depending on if the value is greater
    // than another rate's value
    // 
    // For example:
    // 100 bits = 4 minutes
    // 200 bits = 8 minutes
    // 
    // If the user cheers 150 bits, the user should get 4 minutes
    // But if the user cheers 250 bits, the user should get 8 minutes 

    rates.forEach(rate => {
      if (rate.value <= eventValue) {
        usedRate = rate;
      }
    });

    Log(`Used rate: ${usedRate.type} with value ${usedRate.value} and duration ${usedRate.duration}`, "SubathonManager");
    
    let durationValue = usedRate.duration;
    let donationValue = eventValue;

    if (usedRate.adaptive && usedRate.adaptive_value) {
      const difference = Math.abs(eventValue - usedRate.value);
      const extraDuration = Math.floor(difference * usedRate.adaptive_value);

      durationValue += extraDuration;
    }

    if (usedRate.adaptive && usedRate.donation_value) {
      const extraDonation = Math.floor(eventValue * usedRate.donation_value);
      donationValue = extraDonation;
    }

    this.addEvent({
      type: usedRate.type,
      value: eventValue,
      timestamp: Date.now(),
      rate: usedRate,
      duration: durationValue,
      donation: donationValue,
      multiplier: this.globalMultiplier,
      user_id: event.user_id,
      user_name: event.user_name,
    });

    this.setTimerFromHistory();
    this.setDonationsFromHistory();
    
    switch (type) {
      case "channel.cheer":
        Log(`Received bit donation from ${event.user_name}. Cheered ${event.bits} bits!`, "SubathonManager");
        Log(`Adding ${durationValue} seconds to the timer.`, "SubathonManager");
        Log(`Adding ${donationValue} ${this.data.currency} to the timer.`, "SubathonManager");
        break;
      case "channel.subscribe": {
        Log(`Received subscription from ${event.user_name}.`, "SubathonManager");
        Log(`Adding ${durationValue} seconds to the timer.`, "SubathonManager");
        Log(`Adding ${donationValue} ${this.data.currency} to the timer.`, "SubathonManager");
        break;
      }
    }
    Log(`Timer is now at ${this.timer} seconds.`, "SubathonManager");
    Log(`Donations are now at ${this.donations} ${this.data.currency}.`, "SubathonManager");
  }

  pauseTimer() {
    this.timer_paused = true;
    this.timer_paused_at = Date.now();

    this.addEvent({
      type: "time_paused",
      value: 0,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: 0,
      donation: 0,
      multiplier: 1,
      user_id: "",
      user_name: "",
    });

    Log(`Timer has been paused at ${this.timer}.`, "SubathonManager");
  }

  unpauseTimer() {
    this.timer_paused = false;

    const time_paused = Date.now() - this.timer_paused_at;

    this.addEvent({
      type: "time_unpaused",
      value: 0,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: time_paused,
      donation: 0,
      multiplier: 1,
      user_id: "",
      user_name: "",
    });

    Log(`Timer has been unpaused.`, "SubathonManager");
  }

  getRelevantInfo() {
    return {
      timer: this.timer,
      multiplier: this.globalMultiplier,
      currency: this.data.currency,
      rates: this.data.rates,
      paused: this.timer_paused,
      paused_at: this.timer_paused_at,
      donations: this.donations,
      donation_goal: this.donation_goal,
      most_recent_event: this.getMostRecentEvent(),
      next_goal: this.getDonationGoal(this.getNextDonationGoal().index + 1) || {
        goal: 0,
        title: "No more goals!"
      },
      current_goal: this.getNextDonationGoal().goal || {
        goal: 0,
        title: "No goals yet!"
      },
      goals: this.getGoals(),
    }
  }

  getNextDonationGoal() {
    let nextGoal = this.data.donation_goals[0];

    let nextGoalIndex = 0;
    this.data.donation_goals.forEach(goal => {
      if (this.donations >= goal.goal) {
        nextGoal = this.data.donation_goals[nextGoalIndex + 1];
        nextGoalIndex++;
      }
    });

    return {
      goal: nextGoal,
      index: nextGoalIndex,
    };
  }

  getDonationGoal(index: number) {
    return this.data.donation_goals[index];
  }

  getGoals() {
    return this.data.donation_goals;
  }

  main() {
    Log("Subathon has started!", "SubathonManager");

    Log(`Timer is at ${this.timer} seconds.`, "SubathonManager");
    Log(`Donations are at ${this.donations} ${this.data.currency}.`, "SubathonManager");

    // Start the timer
    const interval = setInterval(() => {
      if (this.timer_paused) {
        return;
      }

      if (this.timer <= 0) {
        Log("Subathon has ended!", "SubathonManager");
        this.timer = 0;
        clearInterval(interval);
        return;
      }

      this.timer -= 1;

      // Log(`Timer is now at ${this.timer} seconds.`, "SubathonManager");
    }, 1000);
  }
}