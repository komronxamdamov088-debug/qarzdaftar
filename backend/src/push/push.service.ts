import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webPush from 'web-push';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { PushSubscriptionRow } from './entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private configured = false;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    config: ConfigService,
  ) {
    const publicKey = config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
    const subject = config.get<string>('VAPID_SUBJECT');

    if (publicKey && privateKey && subject) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
    } else {
      this.logger.warn('VAPID keys not configured — Web Push is disabled.');
    }
  }

  async subscribe(userId: string, dto: SubscribePushDto): Promise<void> {
    const { error } = await this.supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
      { onConflict: 'endpoint' },
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    const { error } = await this.supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAllForUser(userId: string): Promise<PushSubscriptionRow[]> {
    const { data, error } = await this.supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.configured) {
      return;
    }

    const subscriptions = await this.findAllForUser(userId);
    await Promise.all(
      subscriptions.map((subscription) => this.send(subscription, payload)),
    );
  }

  private async send(
    subscription: PushSubscriptionRow,
    payload: PushPayload,
  ): Promise<void> {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
      );
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await this.supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id);
        return;
      }
      this.logger.error(`Push delivery failed: ${(error as Error).message}`);
    }
  }
}
