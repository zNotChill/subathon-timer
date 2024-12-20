import { Data } from "./Data.ts";
import { Log } from "./Logger.ts";
import { dataManager } from "./Manager.ts";
import { MessageEvent } from "./types/EventSub.ts";
import { EventType, Rate, Event } from "./types/Subathon.ts";
export class SubathonManager {
  data: Data;
  sessionHistory: Event[];
  globalMultiplier: number;
  globalMultiplierCountdown: number;

  baseRate: number;

  timer: number;
  uptime: number;
  donations: number;
  donation_goal: number;
  
  timer_paused: boolean;
  timer_paused_at: number;

  constructor() {
    this.data = dataManager.getData();
    this.timer = 600; // 10 mins by default, should this be configurable?
    this.uptime = 0;
    this.sessionHistory = [
      {
        type: "time_added",
        value: this.timer,
        timestamp: Date.now(),
        rate: {} as Rate,
        duration: this.timer,
        donation: 0,
        multiplier: 1,
        base_rate: 1,
        user_id: "",
        user_name: "",
      }
    ];
    this.globalMultiplier = 1;
    this.globalMultiplierCountdown = 0;
    this.baseRate = 1;

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
    return this.data.subathon_config.rates;
  }

  getCurrency() {
    return this.data.subathon_config.currency;
  }

  getRate(type: EventType) {
    return this.data.subathon_config.rates.find(rate => rate.type === type);
  }

  getAllRatesFromType(type: EventType) {
    return this.data.subathon_config.rates.filter(rate => rate.type === type);
  }

  getTimer() {
    return this.timer;
  }

  setGlobalMultiplier(multiplier: number) {
    this.globalMultiplier = multiplier;
  }

  getMessageEventValue(event: MessageEvent, type: EventType) {
    let eventValue: number = 0;

    switch (type) {
      case "channel.cheer":
        eventValue = event.bits ?? 0;
        break;
      case "channel.subscribe":
        eventValue = event.tier ?? 0;
        break;
      case "donation":
        eventValue = event.amount ?? 0;
        break;
    }

    return eventValue;
  }

  setTimerFromHistory() {
    let duration = 0;

    this.sessionHistory.forEach(event => {
      duration += event.duration * event.multiplier * event.base_rate;
    });

    this.timer = duration;
  }

  setDonationsFromHistory() {
    let donations = 0;

    this.sessionHistory.forEach(event => {
      if (event.donation && event.donation > 0)
        donations += event.donation * event.multiplier * event.base_rate;
    });

    this.donations = donations;
  }

  getRewardFromTwitchEvent(event: MessageEvent, type: EventType) {
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

    // Log(`Used rate: ${usedRate.type} with value ${usedRate.value} and duration ${usedRate.duration}`, "SubathonManager");
    
    let durationValue = usedRate.duration;
    let donationValue = eventValue;

    if (usedRate.multiply && usedRate.adaptive_value && usedRate.donation_value) {
      durationValue *= eventValue * usedRate.adaptive_value;
      donationValue = eventValue * usedRate.donation_value;
    }

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
      base_rate: this.baseRate,
      user_id: event.user_id,
      user_name: event.user_name,
      tier: event.tier || 0,
    });

    this.setTimerFromHistory();
    this.setDonationsFromHistory();
    
    switch (type as EventType) {
      case "channel.cheer":
        Log(`Received bit donation from ${event.user_name}. Cheered ${event.bits} bits!`, "SubathonManager");
        break;
      case "channel.subscribe": {
        Log(`Received subscription from ${event.user_name}.`, "SubathonManager");
        break;
      }
      case "donation": {
        Log(`Received donation from ${event.user_name}.`, "SubathonManager");
        break;
      }
    }
    Log(`Timer is now at ${this.timer} seconds (+${durationValue}).`, "SubathonManager");
    Log(`Donations are now at ${this.donations} ${this.data.subathon_config.currency} (+${donationValue}).`, "SubathonManager");
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
      base_rate: 1,
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
      base_rate: 1,
      user_id: "",
      user_name: "",
    });

    Log(`Timer has been unpaused.`, "SubathonManager");
  }

  getRelevantInfo() {
    return {
      timer: this.timer,
      multiplier: this.globalMultiplier,
      multiplier_countdown: this.globalMultiplierCountdown,
      base_rate: this.baseRate,
      currency: this.data.subathon_config.currency,
      rates: this.data.subathon_config.rates,
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
    let nextGoal = this.data.subathon_config.donation_goals[0];

    let nextGoalIndex = 0;
    this.data.subathon_config.donation_goals.forEach(goal => {
      if (this.donations >= goal.goal) {
        nextGoal = this.data.subathon_config.donation_goals[nextGoalIndex + 1];
        nextGoalIndex++;
      }
    });

    return {
      goal: nextGoal,
      index: nextGoalIndex,
    };
  }

  getDonationGoal(index: number) {
    return this.data.subathon_config.donation_goals[index];
  }

  getGoals() {
    return this.data.subathon_config.donation_goals;
  }

  isPaused() {
    return this.timer_paused;
  }

  getGlobalMultiplierCountdown() {
    return this.globalMultiplierCountdown;
  }

  setGlobalMultiplierCountdown(countdown: number) {
    this.globalMultiplierCountdown = countdown;
  }

  main() {
    Log("Subathon has started!", "SubathonManager");

    Log(`Timer is at ${this.timer} seconds.`, "SubathonManager");
    Log(`Donations are at ${this.donations} ${this.data.subathon_config.currency}.`, "SubathonManager");

    // Start the timer
    const interval = setInterval(() => {
      if (!this.timer_paused) {
        if (this.timer <= 0) {
          Log("Subathon has ended!", "SubathonManager");
          this.timer = 0;
          clearInterval(interval);
          return;
        }

        this.timer -= 1;

        if (this.globalMultiplierCountdown > 0) {
          this.globalMultiplierCountdown -= 1;
        } else if (this.globalMultiplierCountdown === 0) {
          this.globalMultiplier = 1;
        }

        this.uptime += 1;
      }


      // Log(`Timer is now at ${this.timer} seconds.`, "SubathonManager");
    }, 1000);
  }
}