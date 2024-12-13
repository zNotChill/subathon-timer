import { EventType } from "./Subathon.ts";

export type StreamlabsEvent = {
  type: EventType, // Not really an EventType, but its close enough for what we need
  message: MessageData[],
  event_id: string,
}

export type MessageData = {
  id: string,
  name: string,
  amount: string,
  formatted_amount?: string,
  formattedAmount?: string,
  message?: string,
  currency?: string,
  // emotes?: any,
  iconClassName?: string,
  to: {
    name: string,
  },
  from: string,
  from_user_id: string,
  skip_alert: boolean,
  _id: string,
  priority: number,
}