import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAllForUser(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Bildirishnoma topilmadi');
    }
    if (data.user_id !== userId) {
      throw new ForbiddenException('Bu bildirishnoma sizga tegishli emas');
    }

    const { data: updated, error: updateError } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw new InternalServerErrorException(updateError.message);
    }
    return updated;
  }

  async create(
    userId: string,
    type: string,
    title: string,
    body?: string,
  ): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, body: body ?? null })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }
}
