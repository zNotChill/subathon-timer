
export type SubscriptionType =  |
  "automod.message.hold" |
  "automod.message.update" |
  "automod.settings.update" |
  "automod.terms.update" |
  "channel.update" |
  "channel.follow" |
  "channel.ad_break.begin" |
  "channel.chat.clear" |
  "channel.chat.clear_user_messages" |
  "channel.chat.message" |
  "channel.chat.message_delete" |
  "channel.chat.notification" |
  "channel.chat_settings.update" |
  "channel.chat.user_message_hold" |
  "channel.chat.user_message_update" |
  "channel.shared_chat.begin" |
  "channel.shared_chat.update" |
  "channel.shared_chat.end" |
  "channel.subscribe" |
  "channel.subscription.end" |
  "channel.subscription.gift" |
  "channel.subscription.message" |
  "channel.cheer" |
  "channel.raid" |
  "channel.ban" |
  "channel.unban" |
  "channel.unban_request.create" |
  "channel.unban_request.resolve" |
  "channel.moderate" |
  "channel.moderator.add" |
  "channel.moderator.remove" |
  "channel.guest_star_session.begin" |
  "channel.guest_star_session.end" |
  "channel.guest_star_session.update" |
  "channel.channel_points_automatic_reward_redemption.add" |
  "channel.channel_points_custom_reward.add" |
  "channel.channel_points_custom_reward.update" |
  "channel.channel_points_custom_reward.remove" |
  "channel.channel_points_custom_reward_redemption.add" |
  "channel.channel_points_custom_reward_redemption.update" |
  "channel.poll.begin" |
  "channel.poll.progress" |
  "channel.poll.end" |
  "channel.prediction.begin" |
  "channel.prediction.progress" |
  "channel.prediction.lock" |
  "channel.prediction.end" |
  "channel.suspicious_user.message" |
  "channel.suspicious_user.update" |
  "channel.vip.add" |
  "channel.vip.remove" |
  "channel.warning.acknowledge" |
  "channel.warning.send" |
  "channel.charity_campaign.donate" |
  "channel.charity_campaign.start" |
  "channel.charity_campaign.progress" |
  "channel.charity_campaign.stop" |
  "conduit.shard.disabled" |
  "drop.entitlement.grant" |
  "extension.bits_transaction.create" |
  "channel.goal.begin" |
  "channel.goal.progress" |
  "channel.goal.end" |
  "channel.hype_train.begin" |
  "channel.hype_train.progress" |
  "channel.hype_train.end" |
  "channel.shield_mode.begin" |
  "channel.shield_mode.end" |
  "channel.shoutout.create" |
  "channel.shoutout.receive" |
  "stream.online" |
  "stream.offline" |
  "user.authorization.grant" |
  "user.authorization.revoke" |
  "user.update" |
  "user.whisper.message";

export type MessageEvent = {
  user_id: string,
  user_login: string,
  user_name: string,
  broadcaster_user_id: string,
  broadcaster_user_login: string,
  broadcaster_user_name: string,
  is_anonymous: boolean;
  message?: string,
  bits?: number,
  followed_at?: string,
  tier?: string,
  is_gift?: boolean,
}

export type DescribedSubscriptionType = {
  type: SubscriptionType,
  description: string,
}