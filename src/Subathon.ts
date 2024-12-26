import { globalData } from "./Data.ts";
import { Data } from "./Data.ts";
import { Log } from "./Logger.ts";
import { dataManager, twitchManager } from "./Manager.ts";
import { MessageEvent } from "./types/EventSub.ts";
import { HelixUser } from "./types/Helix.ts";
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
        helix_user: {} as HelixUser
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

  loadFromData(data: Data) {
    this.data = data;
    this.sessionHistory = data.subathon_config.history;
    this.globalMultiplier = data.backup_info.global_multiplier;
    this.globalMultiplierCountdown = data.backup_info.global_multiplier_countdown;
    this.baseRate = data.backup_info.base_rate;
    this.timer = data.backup_info.timer;
    this.uptime = data.backup_info.uptime;
    console.log(this.uptime, data.backup_info);
    
    this.donations = data.backup_info.donations;
    this.donation_goal = data.backup_info.donation_goal;

    this.setTimerFromHistory();
    this.setDonationsFromHistory();
  }

  addEvent(event: Event) {
    this.sessionHistory.push(event);

    globalData.subathon_config.history = this.sessionHistory;
    globalData.backup_info.global_multiplier = this.globalMultiplier;
    globalData.backup_info.global_multiplier_countdown = this.globalMultiplierCountdown;
    globalData.backup_info.base_rate = this.baseRate;
    globalData.backup_info.timer = this.timer;
    globalData.backup_info.uptime = this.uptime;
    globalData.backup_info.donations = this.donations;
    globalData.backup_info.donation_goal = this.donation_goal;

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
        eventValue = (event.tier ?? 1) / 1000;
        break;
      case "donation":
        eventValue = event.amount ?? 0;
        break;
      case "channel.raid":
        eventValue = event.viewers ?? 0;
        break;
    }

    return eventValue;
  }

  setTimerFromHistory() {
    let duration = 0;

    const timeEvents = this.sessionHistory.filter(event => event.duration > 0);

    timeEvents.forEach(event => {
      let mult = 1;
      let timeSincePreviousEvent = Math.abs(event.timestamp - this.sessionHistory[this.sessionHistory.indexOf(event) - 1]?.timestamp) / 1000;

      if (timeSincePreviousEvent < 0 || !timeSincePreviousEvent) timeSincePreviousEvent = 0;

      // console.log(`TIME FUNC`, mult, timeSincePreviousEvent, event.duration, event.multiplier, event.base_rate);

      if (event.type === "time_removed") mult = -1

      duration += ((event.duration * event.multiplier * event.base_rate) * mult) - timeSincePreviousEvent;
    });

    this.timer = duration;
  }

  setDonationsFromHistory() {
    let donations = 0;
    
    const donationEvents = this.sessionHistory.filter(event => event.donation > 0);

    donationEvents.forEach(event => {
      let mult = 1;

      if (event.type === "money_removed") mult = -1;

      if (event.donation && event.donation > 0) {
        donations += ((event.donation * event.multiplier * event.base_rate) * mult);
      }
    });

    this.donations = donations;
  }

  async getRewardFromTwitchEvent(event: MessageEvent, type: EventType) {
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
    let donationValue = 0;

    switch (usedRate.operation) {
      case "add":
        break;
      case "multiply":
        if (usedRate.time_per) {
          durationValue = (eventValue * usedRate.time_per);
        }
        if (usedRate.money_per) {
          donationValue = (eventValue * usedRate.money_per);
        }
        break;
      case "set":
        if (usedRate.time_per) {
          durationValue = usedRate.time_per;
        }
        if (usedRate.money_per) {
          donationValue = usedRate.money_per;
        }
        break;
    }

    // if (usedRate.adaptive && usedRate.adaptive_value) {
    //   const difference = Math.abs(eventValue - usedRate.value);
    //   const extraDuration = Math.floor(difference * usedRate.adaptive_value);

    //   durationValue += extraDuration;
    // }

    // if (usedRate.adaptive && usedRate.donation_value) {
    //   donationValue = eventValue;
    //   const extraDonation = Math.floor(eventValue * usedRate.donation_value);
    //   donationValue = extraDonation;
    // }

    let user_id = event.user_id;
    let user_name = event.user_name;

    if (type === "channel.raid") {
      user_id = event.from_broadcaster_user_id || "";
      user_name = event.from_broadcaster_user_name || "";
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
      user_id: user_id,
      user_name: user_name,
      helix_user: await twitchManager.getUserInfoFromName(user_name)
    });

    this.setTimerFromHistory();
    this.setDonationsFromHistory();
    
    switch (type as EventType) {
      case "channel.cheer":
        Log(`Received bit donation from ${user_name}. Cheered ${event.bits} bits!`, "SubathonManager");
        break;
      case "channel.subscribe": {
        Log(`Received TIER ${eventValue} subscription from ${user_name}.`, "SubathonManager");
        break;
      }
      case "donation": {
        Log(`Received donation from ${user_name}.`, "SubathonManager");
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
      helix_user: {} as HelixUser
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
      helix_user: {} as HelixUser
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
      uptime_goals: this.getUptimeGoals(),
      current_uptime_goal: this.getCurrentUptimeGoal(),
      next_uptime_goal: this.getUptimeGoal(this.getNextUptimeGoal().index + 1) || {
        goal: 0,
        title: "No more goals!"
      },
      uptime: this.uptime
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

  getNextUptimeGoal() {
    let nextGoal = this.data.subathon_config.uptime_goals[0];

    let nextGoalIndex = 0;
    this.data.subathon_config.uptime_goals.forEach(goal => {
      if (this.uptime >= goal.goal) {
        nextGoal = this.data.subathon_config.uptime_goals[nextGoalIndex + 1];
        nextGoalIndex++;
      }
    });

    return {
      goal: nextGoal,
      index: nextGoalIndex,
    };
  }

  getUptimeGoal(index: number) {
    return this.data.subathon_config.uptime_goals[index];
  }

  getCurrentUptimeGoal() {
    return this.getNextUptimeGoal().goal;
  }

  getUptimeGoals() {
    return this.data.subathon_config.uptime_goals;
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

  addTimeToTimer(time: number) {
    this.timer += time;
    this.addEvent({
      type: "time_added",
      value: time,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: time,
      donation: 0,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    });
    this.setTimerFromHistory();
  }

  removeTimeFromTimer(time: number) {
    this.timer -= time;
    this.addEvent({
      type: "time_removed",
      value: time,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: -time,
      donation: 0,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    });
    this.setTimerFromHistory();
  }

  addGoal(goal: number, title: string) {
    this.data.subathon_config.donation_goals.push({
      goal,
      title,
      description: ""
    });

    dataManager.saveData();
  }

  addUptimeGoal(goal: number, title: string) {
    this.data.subathon_config.uptime_goals.push({
      goal,
      title,
      description: ""
    });

    dataManager.saveData();
  }

  removeGoal(goal: number) {
    this.data.subathon_config.donation_goals = this.data.subathon_config.donation_goals.filter(g => g.goal !== goal);

    dataManager.saveData();
  }

  removeUptimeGoal(goal: number) {
    this.data.subathon_config.uptime_goals = this.data.subathon_config.uptime_goals.filter(g => g.goal !== goal);

    dataManager.saveData();
  }

  findGoal(goal: number) {
    return this.data.subathon_config.donation_goals.find(g => g.goal === goal);
  }

  findUptimeGoal(goal: number) {
    return this.data.subathon_config.uptime_goals.find(g => g.goal === goal);
  }

  addMoneyToDonationCount(amount: number) {
    this.donations += amount;
    this.addEvent({
      type: "money_added",
      value: amount,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: 0,
      donation: amount,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    });
    this.setDonationsFromHistory();
  }

  removeMoneyFromDonationCount(amount: number) {
    this.donations -= amount;
    this.addEvent({
      type: "money_removed",
      value: amount,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: 0,
      donation: -amount,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    });
    this.setDonationsFromHistory();
  }

  setTimer(time: number) {
    this.addEvent({
      type: "time_removed",
      value: this.timer,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: this.timer,
      donation: 0,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    })

    this.addEvent({
      type: "time_added",
      value: time,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: time,
      donation: 0,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    });

    this.timer = time;
  }

  setMoney(amount: number) {
    this.addEvent({
      type: "money_removed",
      value: this.donations,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: 0,
      donation: this.donations,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    })

    this.addEvent({
      type: "money_added",
      value: amount,
      timestamp: Date.now(),
      rate: {} as Rate,
      duration: 0,
      donation: amount,
      multiplier: 1,
      base_rate: 1,
      user_id: "",
      user_name: "",
      helix_user: {} as HelixUser
    });

    this.donations = amount;
  }  
  
  getDonationCount() {
    return this.donations;
  }

  getRecentEvents(count: number = 5) {
    // filter out system events
    return this.sessionHistory.filter(event => event.user_name).slice(-count).reverse();
  }

  getTopDonatingUsers(count: number = 10) {
    const users = this.sessionHistory.filter(event => event.type === "donation" && event.user_name).reduce((acc, event) => {
      if (acc[event.user_name]) {
        acc[event.user_name] += event.donation;
      } else {
        acc[event.user_name] = event.donation;
      }

      return acc;
    }, {} as Record<string, number>);

    return Object.entries(users).sort((a, b) => b[1] - a[1]).slice(0, count);
  }

  getTopTimeAddingUsers(count: number = 10) {
    const users = this.sessionHistory.filter(event => event.type === "donation" && event.user_name).reduce((acc, event) => {
      if (acc[event.user_name]) {
        acc[event.user_name] += event.duration;
      } else {
        acc[event.user_name] = event.duration;
      }

      return acc;
    }, {} as Record<string, number>);

    return Object.entries(users).sort((a, b) => b[1] - a[1]).slice(0, count);
  }

  getTopTotalUsers(count: number = 10) {
    const users = this.sessionHistory.filter(event => event.user_name).reduce((acc, event) => {
      const total = event.donation + event.duration;

      if (acc[event.user_name]) {
        acc[event.user_name].score += total;
        acc[event.user_name].donation += event.donation;
        acc[event.user_name].duration += event.duration;
      } else {
        acc[event.user_name] = {
          username: event.user_name,
          score: total,
          donation: event.donation,
          duration: event.duration
        };
      }

      return acc;
    }, {} as Record<string, { username: string, score: number, donation: number, duration: number }>);

    return Object.values(users).sort((a, b) => b.score - a.score).slice(0, count);
  }

  setData(data: Data) {
    this.data = data;
  }

  setUptime(uptime: number) {
    this.uptime = uptime;
  }

  main() {
    Log("Subathon has started!", "SubathonManager");

    Log(`Timer is at ${this.timer} seconds.`, "SubathonManager");
    Log(`Donations are at ${this.donations} ${this.data.subathon_config.currency}.`, "SubathonManager");

    const _interval = setInterval(() => {
      if (!this.timer_paused) {
        if (this.timer <= 0) {
          this.timer = 0;
        } else {
          this.timer -= 1;
        }
        
        this.uptime += 1;

        if (this.globalMultiplierCountdown > 0) {
          this.globalMultiplierCountdown -= 1;
        } else if (this.globalMultiplierCountdown === 0) {
          this.globalMultiplier = 1;
        }

      }
    }, 1000);
  }
}