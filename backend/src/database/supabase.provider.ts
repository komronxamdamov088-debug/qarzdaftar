import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import { Database } from './database.types';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';
export type SupabaseClient = ReturnType<typeof createClient<Database>>;

export const supabaseProvider: Provider = {
  provide: SUPABASE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    return createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  },
};
