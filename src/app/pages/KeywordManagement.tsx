import { useState } from 'react';
import { Plus, Target, Sparkles, CheckCircle2, TrendingUp, Search } from 'lucide-react';

interface Keyword {
  id: string;
  keyword: string;
  difficulty: 'low' | 'medium' | 'high';
  intent: 'informational' | 'transactional' | 'navigational';
  searchVolume: string;
  postsCreated: number;
}

export function KeywordManagement() {
  const [keywords, setKeywords] = useState<Keyword[]>([
    {
      id: '1',
      keyword: 'vehicle history check India',
      difficulty: 'medium',
      intent: 'transactional',
      searchVolume: '12K',
      postsCreated: 5,
    },
    {
      id: '2',
      keyword: 'used car inspection checklist',
      difficulty: 'low',
      intent: 'informational',
      searchVolume: '8.5K',
      postsCreated: 4,
    },
    {
      id: '3',
      keyword: 'RTO verification online',
      difficulty: 'high',
      intent: 'transactional',
      searchVolume: '15K',
      postsCreated: 6,
    },
    {
      id: '4',
      keyword: 'car document verification',
      difficulty: 'medium',
      intent: 'informational',
      searchVolume: '6.2K',
      postsCreated: 3,
    },
    {
      id: '5',
      keyword: 'used car buying tips India',
      difficulty: 'low',
      intent: 'informational',
      searchVolume: '9.8K',
      postsCreated: 7,
    },
  ]);

  const [newKeyword, setNewKeyword] = useState('');
  const [timePeriod, setTimePeriod] = useState<'30' | '60' | '90'>('30');
  const [searchQuery, setSearchQuery] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const keyword: Keyword = {
        id: Date.now().toString(),
        keyword: newKeyword.trim(),
        difficulty: 'medium',
        intent: 'informational',
        searchVolume: '-',
        postsCreated: 0,
      };
      setKeywords([...keywords, keyword]);
      setNewKeyword('');
    }
  };

  const filteredKeywords = keywords.filter(kw =>
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: keywords.length,
    lowDifficulty: keywords.filter(k => k.difficulty === 'low').length,
    mediumDifficulty: keywords.filter(k => k.difficulty === 'medium').length,
    highDifficulty: keywords.filter(k => k.difficulty === 'high').length,
    totalPosts: keywords.reduce((sum, k) => sum + k.postsCreated, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Keyword Management</h1>
        <p className="text-slate-600">Manage target keywords for AI content generation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Keywords</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.lowDifficulty}</p>
              <p className="text-sm text-slate-600">Low Difficulty</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.mediumDifficulty}</p>
              <p className="text-sm text-slate-600">Medium Difficulty</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalPosts}</p>
              <p className="text-sm text-slate-600">Posts Created</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Keyword Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Add New Keyword</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="e.g., used car buying guide India"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as '30' | '60' | '90')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="30">30 Days Plan</option>
              <option value="60">60 Days Plan</option>
              <option value="90">90 Days Plan</option>
            </select>
          </div>

          <button
            onClick={addKeyword}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Keyword
          </button>
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">Your Keywords</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keywords..."
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Keyword</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Difficulty</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Intent</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Search Volume</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Posts Created</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((kw) => (
                <tr key={kw.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-slate-900">{kw.keyword}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      kw.difficulty === 'low' ? 'bg-green-100 text-green-700' :
                      kw.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {kw.difficulty}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {kw.intent}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-slate-900">{kw.searchVolume}</span>
                    <span className="text-sm text-slate-500 ml-1">/month</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-blue-600">{kw.postsCreated}</span>
                  </td>
                  <td className="py-4 px-6">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Content Plan Button */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 mb-2">Ready to Generate Content?</h3>
            <p className="text-slate-600">
              AI will create {timePeriod} days of content based on your {keywords.length} keywords
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap">
            <Sparkles className="w-5 h-5" />
            Generate Plan
          </button>
        </div>
      </div>
    </div>
  );
}
