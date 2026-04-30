import { useEffect, useMemo, useState } from 'react';
import { CalendarView } from '../components/CalendarView';
import {
  Calendar as CalendarIcon,
  FileText,
  Grid,
  List,
  Loader2,
  RefreshCw,
  Trash2,
  Edit3,
  Save,
  X,
  Wand2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  listScheduledPosts,
  cancelScheduledPost,
  bulkDeleteScheduledPosts,
  retryFailedScheduledPosts,
  updateScheduledPost,
  prefillScheduledPost,
  regenerateImage as regenerateImageApi,
  regenerateCaption as regenerateCaptionApi,
  type ScheduledPost,
} from '../utils/autoPostService';

const STATUS_TONE: Record<ScheduledPost['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-600',
};

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' • ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
};

// HTML datetime-local needs YYYY-MM-DDTHH:mm in *local* time
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ContentCalendar() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prefillingAll, setPrefillingAll] = useState(false);
  const [prefillProgress, setPrefillProgress] = useState({ done: 0, total: 0 });
  const [retrying, setRetrying] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const items = await listScheduledPosts();
      setPosts(items);
      // drop any selected ids that no longer exist
      setSelected((prev) => {
        const next = new Set<string>();
        items.forEach((p) => prev.has(p.id) && next.add(p.id));
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(
    () => ({
      total: posts.length,
      pending: posts.filter((p) => p.status === 'pending').length,
      published: posts.filter((p) => p.status === 'published').length,
      failed: posts.filter((p) => p.status === 'failed').length,
      drafted: posts.filter((p) => p.status === 'pending' && (p.caption || p.image_url)).length,
    }),
    [posts]
  );

  const calendarPosts = useMemo(
    () =>
      posts.map((p) => ({
        id: p.id,
        platform: 'social',
        type: p.status === 'published' ? 'Published' : 'Scheduled',
        title: p.title || p.keyword,
        scheduledDate: p.scheduled_for,
        status: (p.status === 'published' ? 'published' : p.status === 'pending' ? 'scheduled' : 'draft') as
          | 'scheduled'
          | 'published'
          | 'draft',
        keywords: [p.keyword],
      })),
    [posts]
  );

  const editablePostIds = useMemo(
    () => posts.filter((p) => ['pending', 'failed', 'cancelled'].includes(p.status)).map((p) => p.id),
    [posts]
  );

  const allEditableSelected =
    editablePostIds.length > 0 && editablePostIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allEditableSelected) {
        editablePostIds.forEach((id) => next.delete(id));
      } else {
        editablePostIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRetryAllFailed = async () => {
    const failedCount = posts.filter((p) => p.status === 'failed').length;
    if (failedCount === 0) {
      alert('No failed posts to retry.');
      return;
    }
    if (!window.confirm(`Re-queue ${failedCount} failed post(s) so the cron worker tries again? Past-due slots will fire on the next minute tick.`))
      return;
    setRetrying(true);
    try {
      const n = await retryFailedScheduledPosts();
      alert(`✅ Re-queued ${n} post(s). The cron worker will pick them up within ~60 seconds.`);
      await refresh();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected post(s)? This cannot be undone.`)) return;
    try {
      const n = await bulkDeleteScheduledPosts(Array.from(selected));
      alert(`✅ Deleted ${n} post(s).`);
      await refresh();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  const handleCancelOne = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await cancelScheduledPost(id);
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  // Sequentially pre-fill every pending post that doesn't already have caption+image,
  // so the user sees progress (each call ~10-15s for caption + image).
  const handlePrefillAll = async () => {
    const targets = posts.filter(
      (p) => p.status === 'pending' && (!p.caption || !p.image_url)
    );
    if (targets.length === 0) {
      alert('All pending posts already have content drafted.');
      return;
    }
    if (
      !window.confirm(
        `Generate caption + image for ${targets.length} pending post(s)? This will take roughly ${Math.ceil(
          (targets.length * 12) / 60
        )} minutes and consume Gemini/OpenAI credits.`
      )
    )
      return;

    setPrefillingAll(true);
    setPrefillProgress({ done: 0, total: targets.length });
    let ok = 0;
    let failed = 0;
    for (const p of targets) {
      try {
        const r = await prefillScheduledPost(p.id, 'all');
        setPosts((prev) =>
          prev.map((x) =>
            x.id === p.id ? { ...x, caption: r.caption, image_url: r.image_url } : x
          )
        );
        ok += 1;
      } catch (err) {
        console.warn('prefill failed for', p.id, err);
        failed += 1;
      }
      setPrefillProgress((cur) => ({ ...cur, done: cur.done + 1 }));
    }
    setPrefillingAll(false);
    alert(`Prefill done. ✅ ${ok} succeeded, ❌ ${failed} failed.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Calendar</h1>
          <p className="text-slate-600">Review, edit, regenerate, or delete scheduled posts.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Grid className="w-4 h-4" /> Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Stat label="Total" value={stats.total} tone="blue" />
        <Stat label="Pending" value={stats.pending} tone="amber" />
        <Stat label="Drafted" value={stats.drafted} tone="purple" />
        <Stat label="Published" value={stats.published} tone="green" />
        <Stat label="Failed" value={stats.failed} tone="red" />
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView posts={calendarPosts as any} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allEditableSelected}
                onChange={toggleSelectAll}
                disabled={editablePostIds.length === 0}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">
                {selected.size > 0
                  ? `${selected.size} selected`
                  : `Select all (${editablePostIds.length})`}
              </span>
              {selected.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete selected
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {stats.failed > 0 && (
                <button
                  onClick={handleRetryAllFailed}
                  disabled={retrying}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
                  title="Re-queue every failed post so the cron worker tries again"
                >
                  {retrying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Retrying…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Retry all failed ({stats.failed})
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handlePrefillAll}
                disabled={prefillingAll || stats.pending === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
                title="Generate caption + image for every pending post that's missing them"
              >
                {prefillingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pre-filling… {prefillProgress.done}/{prefillProgress.total}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Pre-fill all pending content
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center text-slate-500 py-8">
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                No scheduled posts yet. Go to <strong>Keywords</strong>, configure auto-post, and click "Generate 14-day schedule".
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    selected={selected.has(p.id)}
                    onToggleSelect={() => toggleSelect(p.id)}
                    onDelete={() => handleCancelOne(p.id)}
                    onUpdated={(updated) =>
                      setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostCard — full-detail card with inline edit + regenerate buttons
// ---------------------------------------------------------------------------
function PostCard({
  post,
  selected,
  onToggleSelect,
  onDelete,
  onUpdated,
}: {
  post: ScheduledPost;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onUpdated: (post: ScheduledPost) => void;
}) {
  const editable = ['pending', 'failed', 'cancelled'].includes(post.status);
  const [editing, setEditing] = useState(false);
  const [draftCaption, setDraftCaption] = useState(post.caption || '');
  const [draftKeyword, setDraftKeyword] = useState(post.keyword || '');
  const [draftWhen, setDraftWhen] = useState(toLocalInput(post.scheduled_for));
  const [busy, setBusy] = useState<null | 'save' | 'image' | 'caption' | 'prefill'>(null);

  const startEdit = () => {
    setDraftCaption(post.caption || '');
    setDraftKeyword(post.keyword || '');
    setDraftWhen(toLocalInput(post.scheduled_for));
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setBusy('save');
    try {
      const updated = await updateScheduledPost(post.id, {
        caption: draftCaption,
        keyword: draftKeyword,
        scheduled_for: new Date(draftWhen).toISOString(),
        requeue: post.status === 'failed' || post.status === 'cancelled',
      });
      onUpdated(updated);
      setEditing(false);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const doRegenImage = async () => {
    setBusy('image');
    try {
      const url = await regenerateImageApi(post.id);
      onUpdated({ ...post, image_url: url });
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const doRegenCaption = async () => {
    setBusy('caption');
    try {
      const cap = await regenerateCaptionApi(post.id);
      onUpdated({ ...post, caption: cap });
      if (editing) setDraftCaption(cap);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const doPrefillAll = async () => {
    setBusy('prefill');
    try {
      const r = await prefillScheduledPost(post.id, 'all');
      onUpdated({ ...post, caption: r.caption, image_url: r.image_url });
      if (editing) setDraftCaption(r.caption);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        selected ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:shadow-md hover:border-blue-300'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* checkbox */}
        {editable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-2 w-4 h-4 accent-blue-600 flex-shrink-0"
          />
        )}

        {/* image preview / placeholder */}
        <div className="flex-shrink-0 relative">
          {post.image_url ? (
            <img
              src={post.image_url}
              alt=""
              className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border border-slate-200"
            />
          ) : (
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="w-8 h-8 mb-1" />
              <span className="text-xs">No image yet</span>
            </div>
          )}
          {editable && (
            <button
              onClick={doRegenImage}
              disabled={busy !== null}
              className="absolute bottom-1 right-1 px-2 py-1 bg-white/90 border border-slate-200 rounded-md text-xs font-medium hover:bg-white shadow-sm flex items-center gap-1 disabled:opacity-50"
              title="Regenerate image"
            >
              {busy === 'image' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Regen
            </button>
          )}
        </div>

        {/* body */}
        <div className="flex-1 min-w-0">
          {/* meta row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_TONE[post.status]}`}>
              {post.status}
            </span>
            {post.caption && post.image_url && post.status === 'pending' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Drafted
              </span>
            )}
            <span className="text-xs text-slate-500">{post.caption_size}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {fmtDateTime(post.scheduled_for)}
            </span>
          </div>

          {/* keyword + actions */}
          {editing ? (
            <input
              type="text"
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              className="w-full mb-2 px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold"
            />
          ) : (
            <h4 className="font-bold text-slate-900 mb-2 truncate">{post.keyword}</h4>
          )}

          {/* schedule edit */}
          {editing && (
            <input
              type="datetime-local"
              value={draftWhen}
              onChange={(e) => setDraftWhen(e.target.value)}
              className="mb-2 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          )}

          {/* caption */}
          {editing ? (
            <textarea
              value={draftCaption}
              onChange={(e) => setDraftCaption(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-y focus:ring-2 focus:ring-blue-500"
            />
          ) : post.caption ? (
            <p className="text-sm text-slate-700 whitespace-pre-line">{post.caption}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No caption drafted yet — click <strong>Pre-fill</strong> to generate one.
            </p>
          )}

          {post.error_msg && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{post.error_msg}</span>
            </div>
          )}

          {/* action buttons */}
          {editable && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!editing ? (
                <>
                  <button
                    onClick={startEdit}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={doRegenCaption}
                    disabled={busy !== null}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50"
                  >
                    {busy === 'caption' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    Regen caption
                  </button>
                  {(!post.caption || !post.image_url) && (
                    <button
                      onClick={doPrefillAll}
                      disabled={busy !== null}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-semibold hover:bg-purple-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      {busy === 'prefill' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      Pre-fill
                    </button>
                  )}
                  <button
                    onClick={onDelete}
                    className="ml-auto px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-xs font-semibold hover:bg-red-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={busy !== null}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    {busy === 'save' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'blue' | 'amber' | 'green' | 'red' | 'purple';
}) {
  const toneClasses = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  }[tone];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${toneClasses} rounded-lg flex items-center justify-center`}>
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
