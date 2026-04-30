// Frontend client for keyword pool + auto-post scheduling.

import { API_BASE_URL } from './apiConfig';
import { getAccessToken } from './authService';

const headers = () => {
  const t = getAccessToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

export type Keyword = {
  id: string;
  keyword: string;
  position: number;
  posts_created: number;
  created_at: string;
};

export type CaptionSize = 'HE' | 'GNP' | 'GIP';

export type AutoPostConfig = {
  enabled: boolean;
  posts_per_day: number;
  posting_times: string[]; // ["09:00","18:00"]
  caption_size: CaptionSize;
};

export type ScheduledPost = {
  id: string;
  keyword: string;
  caption_size: CaptionSize;
  title: string | null;
  caption: string | null;
  image_url: string | null;
  scheduled_for: string;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  publish_results: any[] | null;
  error_msg: string | null;
  published_at: string | null;
};

// ----- Keywords -----
export const listKeywords = async (): Promise<Keyword[]> => {
  const r = await fetch(`${API_BASE_URL}/keywords`, { headers: headers() });
  const data = await r.json();
  return r.ok && data.success ? data.keywords : [];
};

export const addKeyword = async (keyword: string): Promise<Keyword> => {
  const r = await fetch(`${API_BASE_URL}/keywords`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ keyword }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Failed to add keyword');
  return data.keyword;
};

export const deleteKeyword = async (id: string): Promise<void> => {
  const r = await fetch(`${API_BASE_URL}/keywords/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete keyword');
  }
};

// ----- Auto-post config -----
export const getAutoPostConfig = async (): Promise<AutoPostConfig> => {
  const r = await fetch(`${API_BASE_URL}/auto-post/config`, { headers: headers() });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Failed to load config');
  return data.config;
};

export const saveAutoPostConfig = async (cfg: AutoPostConfig): Promise<AutoPostConfig> => {
  const r = await fetch(`${API_BASE_URL}/auto-post/config`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(cfg),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Failed to save config');
  return data.config;
};

export const generateSchedule = async (
  days: number = 14
): Promise<{ scheduled: number; days: number; postsPerDay: number }> => {
  const r = await fetch(`${API_BASE_URL}/auto-post/schedule`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ days }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Schedule failed');
  return { scheduled: data.scheduled, days: data.days, postsPerDay: data.postsPerDay };
};

export const runNow = async (
  caption_size: CaptionSize = 'GNP'
): Promise<{ id: string; keyword: string; caption: string; imageUrl: string; status: string }> => {
  const r = await fetch(`${API_BASE_URL}/auto-post/run-now`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ caption_size }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Run failed');
  return data;
};

// ----- Scheduled posts (calendar feed) -----
export const listScheduledPosts = async (params?: {
  from?: string;
  to?: string;
  status?: ScheduledPost['status'];
}): Promise<ScheduledPost[]> => {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.status) qs.set('status', params.status);
  const url = `${API_BASE_URL}/scheduled-posts${qs.toString() ? '?' + qs : ''}`;
  const r = await fetch(url, { headers: headers() });
  const data = await r.json();
  return r.ok && data.success ? data.posts : [];
};

export const cancelScheduledPost = async (id: string): Promise<void> => {
  const r = await fetch(`${API_BASE_URL}/scheduled-posts/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!r.ok) throw new Error('Failed to cancel');
};

export const retryFailedScheduledPosts = async (ids?: string[]): Promise<number> => {
  const r = await fetch(`${API_BASE_URL}/scheduled-posts/retry-failed`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(ids && ids.length > 0 ? { ids } : {}),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Retry failed');
  return data.retried || 0;
};

export const bulkDeleteScheduledPosts = async (ids: string[]): Promise<number> => {
  if (ids.length === 0) return 0;
  const r = await fetch(`${API_BASE_URL}/scheduled-posts/bulk-delete`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ids }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Bulk delete failed');
  return data.deleted || 0;
};

export const updateScheduledPost = async (
  id: string,
  patch: Partial<{
    caption: string;
    image_url: string;
    scheduled_for: string;
    keyword: string;
    title: string;
    requeue: boolean;
  }>
): Promise<ScheduledPost> => {
  const r = await fetch(`${API_BASE_URL}/scheduled-posts/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(patch),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Update failed');
  return data.post;
};

export const prefillScheduledPost = async (
  id: string,
  only: 'caption' | 'image' | 'all' = 'all'
): Promise<{ caption: string; image_url: string }> => {
  const r = await fetch(`${API_BASE_URL}/scheduled-posts/${id}/prefill`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ only }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Prefill failed');
  return { caption: data.caption, image_url: data.image_url };
};

export const regenerateImage = async (id: string): Promise<string> => {
  const r = await fetch(`${API_BASE_URL}/scheduled-posts/${id}/regenerate-image`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Regenerate failed');
  return data.image_url;
};

export const regenerateCaption = async (id: string): Promise<string> => {
  const r = await fetch(`${API_BASE_URL}/scheduled-posts/${id}/regenerate-caption`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || 'Regenerate failed');
  return data.caption;
};
