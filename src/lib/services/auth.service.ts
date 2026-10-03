// =============================================================================
// Auth Service – sign-up, sign-in, sign-out, profile management
// =============================================================================
import { supabase } from '../supabase';
import type { Profile } from '../database.types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // row not found
    throw error;
  }
  return data as Profile;
}

export interface CreateProfilePayload {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
}

export async function createProfile({ userId, displayName, handle, avatarUrl }: CreateProfilePayload): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name: displayName,
      handle: handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      avatar_url: avatarUrl ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'handle' | 'avatar_url'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

/** Check if a handle is available (case-insensitive) */
export async function isHandleAvailable(handle: string, excludeUserId?: string): Promise<boolean> {
  let query = supabase
    .from('profiles')
    .select('id')
    .ilike('handle', handle);

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.length === 0;
}

/** Upload avatar to Supabase Storage and return the public URL */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const FileSystem = require('expo-file-system/legacy');
  const { decode } = require('base64-arraybuffer');

  const ext = uri.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, decode(base64), { contentType: `image/${ext}`, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
