import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Target,
  Sparkles,
  Search,
  Trash2,
  Loader2,
  CalendarDays,
  Play,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  listKeywords,
  addKeyword,
  deleteKeyword,
  getAutoPostConfig,
  saveAutoPostConfig,
  generateSchedule,
  runNow,
  type Keyword,
  type AutoPostConfig,
  type CaptionSize,
} from '../utils/autoPostService';

const CAPTION_OPTIONS: { value: CaptionSize; label: string; description: string }[] = [
  { value: 'HE', label: 'HE — Highest Engagement', description: '150–200 chars, punchy' },
  { value: 'GNP', label: 'GNP — Normal Posts', description: '300–350 chars, balanced' },
  { value: 'GIP', label: 'GIP — Informative', description: '450+ chars, detailed' },
];

export function KeywordManagement() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [config, setConfig] = useState<AutoPostConfig>({
    enabled: false,
    posts_per_day: 2,
    posting_times: ['09:00', '18:00'],
    caption_size: 'GNP',
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [runningNow, setRunningNow] = useState(false);

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const [kws, cfg] = await Promise.all([listKeywords(), getAutoPostConfig()]);
        setKeywords(kws);
        setConfig(cfg);
      } catch (err) {
        console.error('Failed to load keyword/config:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async () => {
    if (!newKeyword.trim()) return;
    setAdding(true);
    try {
      const added = await addKeyword(newKeyword.trim());
      setKeywords((prev) => [...prev, added]);
      setNewKeyword('');
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const kw = keywords.find((k) => k.id === id);
    if (!kw) return;
    if (!window.confirm(`Delete keyword "${kw.keyword}"?`)) return;
    try {
      await deleteKeyword(id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  const updatePostsPerDay = (n: number) => {
    n = Math.max(1, Math.min(24, n));
    setConfig((prev) => {
      let times = prev.posting_times.slice(0, n);
      while (times.length < n) {
        // distribute remaining slots evenly through the day
        const hour = Math.round(((times.length + 1) * 24) / (n + 1));
        times.push(`${String(hour).padStart(2, '0')}:00`);
      }
      return { ...prev, posts_per_day: n, posting_times: times };
    });
  };

  const updateTime = (idx: number, value: string) => {
    setConfig((prev) => {
      const times = [...prev.posting_times];
      times[idx] = value;
      return { ...prev, posting_times: times };
    });
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const saved = await saveAutoPostConfig(config);
      setConfig(saved);
      alert('✅ Auto-post config saved.');
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSchedule = async () => {
    if (keywords.length === 0) {
      alert('Add at least one keyword first.');
      return;
    }
    setScheduling(true);
    try {
      const r = await generateSchedule(14);
      alert(`✅ Scheduled ${r.scheduled} posts across ${r.days} days (${r.postsPerDay}/day). Open Calendar to see them.`);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setScheduling(false);
    }
  };

  const handleRunNow = async () => {
    if (keywords.length === 0) {
      alert('Add at least one keyword first.');
      return;
    }
    setRunningNow(true);
    try {
      const r = await runNow(config.caption_size);
      alert(
        `✅ Posted "${r.keyword}"\nStatus: ${r.status}\n\nCaption preview:\n${(r.caption || '').slice(0, 240)}…`
      );
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setRunningNow(false);
    }
  };

  const filteredKeywords = useMemo(
    () => keywords.filter((kw) => kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())),
    [keywords, searchQuery]
  );

  const stats = {
    total: keywords.length,
    totalPosts: keywords.reduce((s, k) => s + k.posts_created, 0),
    cycleDays:
      config.posts_per_day > 0 && keywords.length > 0
        ? Math.ceil(keywords.length / config.posts_per_day)
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Keyword Management</h1>
        <p className="text-slate-600">
          Add keywords, configure cadence — Motopsy will post on your connected pages automatically.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat icon={<Target className="w-5 h-5" />} value={stats.total} label="Total Keywords" tone="purple" />
        <Stat icon={<Sparkles className="w-5 h-5" />} value={stats.totalPosts} label="Posts Created" tone="blue" />
        <Stat
          icon={<CalendarDays className="w-5 h-5" />}
          value={stats.cycleDays}
          label={`Days per cycle (@ ${config.posts_per_day}/day)`}
          tone="green"
        />
      </div>

      {/* Auto-Post Config */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Auto-Publishing</h2>
            <p className="text-sm text-slate-600 mt-1">
              The cron worker picks the next keyword (round-robin), generates caption + image, and publishes to your connected pages.
            </p>
          </div>
          <label className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Enabled</span>
            <button
              onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                config.enabled ? 'bg-green-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  config.enabled ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Posts per day</label>
            <input
              type="number"
              min={1}
              max={12}
              value={config.posts_per_day}
              onChange={(e) => updatePostsPerDay(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Caption size</label>
            <select
              value={config.caption_size}
              onChange={(e) => setConfig((c) => ({ ...c, caption_size: e.target.value as CaptionSize }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {CAPTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save config
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Posting times</label>
          <div className="flex flex-wrap gap-2">
            {config.posting_times.map((t, i) => (
              <input
                key={i}
                type="time"
                value={t}
                onChange={(e) => updateTime(i, e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Server time. Each slot fires one post; the keyword is taken from the round-robin queue.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={handleSchedule}
            disabled={scheduling || keywords.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            Generate 14-day schedule
          </button>
          <button
            onClick={handleRunNow}
            disabled={runningNow || keywords.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            {runningNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Post one now (test)
          </button>
        </div>
      </div>

      {/* Add Keyword */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Add New Keyword</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g., used car buying tips India"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newKeyword.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Add Keyword
          </button>
        </div>
      </div>

      {/* Keywords list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-lg">Your Keywords</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Loading…
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No keywords yet — add some above.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-slate-700 w-16">#</th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-700">Keyword</th>
                  <th className="text-left py-3 px-6 font-semibold text-slate-700">Posts created</th>
                  <th className="text-right py-3 px-6"></th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map((kw, i) => (
                  <tr key={kw.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-6 text-slate-500">{i + 1}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-slate-900">{kw.keyword}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="font-bold text-blue-600">{kw.posts_created}</span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleDelete(kw.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {config.enabled && keywords.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-sm text-green-800">
            Auto-publishing is <strong>enabled</strong>. Click "Generate 14-day schedule" to fill the
            calendar — the cron worker will then publish each scheduled post automatically at its slot.
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  tone: 'purple' | 'blue' | 'green';
}) {
  const toneClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
  }[tone];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${toneClasses} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
