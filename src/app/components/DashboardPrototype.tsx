import { useState } from 'react';
import { Plus, Sparkles, Calendar, FileText, Instagram, Linkedin, Twitter, Youtube, TrendingUp, Clock, Target, CheckCircle2, AlertCircle, Send, Bot, MessageSquare, X, List, CalendarDays } from 'lucide-react';
import { AIAssistantChat } from './AIAssistantChat';
import { CalendarView } from './CalendarView';

interface Keyword {
  id: string;
  keyword: string;
  difficulty: string;
  intent: string;
}

interface ScheduledPost {
  id: string;
  platform: string;
  type: string;
  title: string;
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'draft';
  keywords: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: any;
}

export function DashboardPrototype() {
  const [keywords, setKeywords] = useState<Keyword[]>([
    { id: '1', keyword: 'vehicle history check India', difficulty: 'medium', intent: 'transactional' },
    { id: '2', keyword: 'used car inspection checklist', difficulty: 'low', intent: 'informational' },
    { id: '3', keyword: 'RTO verification online', difficulty: 'high', intent: 'transactional' },
  ]);
  
  const [newKeyword, setNewKeyword] = useState('');
  const [timePeriod, setTimePeriod] = useState<'30' | '60' | '90'>('30');
  const [planGenerated, setPlanGenerated] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your AI Marketing Assistant. I can help you with:\n\n• View schedules (this week, next week)\n• Filter by keywords or platforms\n• Make changes to upcoming posts\n• Provide content insights\n\nWhat would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);

  const scheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      platform: 'blog',
      type: 'SEO Blog',
      title: 'Complete Guide to Vehicle History Check in India',
      scheduledDate: '2026-03-15',
      status: 'scheduled',
      keywords: ['vehicle history check India', 'RTO verification online'],
    },
    {
      id: '2',
      platform: 'instagram',
      type: 'Instagram Reel',
      title: '5 Red Flags in Used Car History Reports',
      scheduledDate: '2026-03-16',
      status: 'scheduled',
      keywords: ['vehicle history check India'],
    },
    {
      id: '3',
      platform: 'linkedin',
      type: 'LinkedIn Post',
      title: 'Why RTO Verification is Critical Before Buying Used Cars',
      scheduledDate: '2026-03-17',
      status: 'scheduled',
      keywords: ['RTO verification online'],
    },
    {
      id: '4',
      platform: 'youtube',
      type: 'YouTube Video',
      title: 'Step-by-Step Car Inspection Checklist for Buyers',
      scheduledDate: '2026-03-18',
      status: 'scheduled',
      keywords: ['used car inspection checklist'],
    },
    {
      id: '5',
      platform: 'blog',
      type: 'SEO Blog',
      title: 'Understanding RTO Verification Process Online',
      scheduledDate: '2026-03-20',
      status: 'scheduled',
      keywords: ['RTO verification online'],
    },
    {
      id: '6',
      platform: 'twitter',
      type: 'X Thread',
      title: 'Thread: Top 10 Things to Check in Used Car Inspection',
      scheduledDate: '2026-03-21',
      status: 'scheduled',
      keywords: ['used car inspection checklist'],
    },
    {
      id: '7',
      platform: 'instagram',
      type: 'Instagram Post',
      title: 'Infographic: Car Inspection Checklist',
      scheduledDate: '2026-03-22',
      status: 'draft',
      keywords: ['used car inspection checklist'],
    },
    {
      id: '8',
      platform: 'linkedin',
      type: 'LinkedIn Article',
      title: 'The Future of Vehicle Verification in India',
      scheduledDate: '2026-03-24',
      status: 'scheduled',
      keywords: ['vehicle history check India', 'RTO verification online'],
    },
  ];

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const keyword: Keyword = {
        id: Date.now().toString(),
        keyword: newKeyword.trim(),
        difficulty: 'medium',
        intent: 'informational',
      };
      setKeywords([...keywords, keyword]);
      setNewKeyword('');
    }
  };

  const generatePlan = () => {
    setPlanGenerated(true);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'blog':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'linkedin':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'twitter':
        return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'youtube':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'blog':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-700';
      case 'published':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const contentStats = {
    totalPosts: scheduledPosts.length,
    blogs: scheduledPosts.filter(p => p.platform === 'blog').length,
    social: scheduledPosts.filter(p => p.platform !== 'blog' && p.platform !== 'youtube').length,
    videos: scheduledPosts.filter(p => p.platform === 'youtube').length,
  };

  const handleChatInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: chatInput.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages([...messages, newMessage]);
      setChatInput('');

      // Simulate assistant response
      setTimeout(() => {
        const assistantResponse: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Sure, I can help with that. What specific information are you looking for?",
          timestamp: new Date().toISOString(),
        };
        setMessages([...messages, newMessage, assistantResponse]);
      }, 1000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">AI Content Planning Dashboard</h2>
        <p className="text-slate-600">Interactive prototype - Add keywords and generate automated content plan</p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{keywords.length}</div>
              <div className="text-sm text-slate-600">Keywords Targeted</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{contentStats.totalPosts}</div>
              <div className="text-sm text-slate-600">Posts Scheduled</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{timePeriod}</div>
              <div className="text-sm text-slate-600">Days Planning</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-600 text-white rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">95%</div>
              <div className="text-sm text-slate-600">Automation Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Management Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-lg">Keyword Management</h3>
          <p className="text-sm text-slate-600 mt-1">Add target keywords to generate AI-powered content plan</p>
        </div>

        <div className="p-6">
          {/* Add Keyword Form */}
          <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Add New Keyword</label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="e.g., used car buying guide India"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="w-full md:w-48">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Time Period</label>
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value as '30' | '60' | '90')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={addKeyword}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
                <button
                  onClick={generatePlan}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Plan
                </button>
              </div>
            </div>
          </div>

          {/* Keywords Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Keyword</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Difficulty</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Intent</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => (
                  <tr key={kw.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{kw.keyword}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        kw.difficulty === 'low' ? 'bg-green-100 text-green-700' :
                        kw.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {kw.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {kw.intent}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Generated Plan Alert */}
      {planGenerated && (
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">AI Content Plan Generated!</h4>
            <p className="text-sm text-blue-700 mt-1">
              Based on your {keywords.length} keywords, we've created a {timePeriod}-day content strategy with {contentStats.totalPosts} pieces of content across all platforms.
            </p>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <CalendarView posts={scheduledPosts} />

      {/* Upcoming Posts Schedule */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Upcoming Content Schedule</h3>
              <p className="text-sm text-slate-600 mt-1">AI-generated posts based on target keywords</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                {contentStats.blogs} Blogs
              </span>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                {contentStats.social} Social
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                {contentStats.videos} Videos
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-blue-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`px-3 py-1.5 rounded-lg border font-semibold text-sm flex items-center gap-2 ${getPlatformColor(post.platform)}`}>
                        {getPlatformIcon(post.platform)}
                        {post.type}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 mb-2">{post.title}</h4>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex flex-wrap gap-1">
                        {post.keywords.map((kw, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Distribution Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Content by Platform</h3>
          <div className="space-y-3">
            {[
              { platform: 'SEO Blog', count: contentStats.blogs, color: 'bg-purple-500', percentage: (contentStats.blogs / contentStats.totalPosts) * 100 },
              { platform: 'Instagram', count: scheduledPosts.filter(p => p.platform === 'instagram').length, color: 'bg-pink-500', percentage: (scheduledPosts.filter(p => p.platform === 'instagram').length / contentStats.totalPosts) * 100 },
              { platform: 'LinkedIn', count: scheduledPosts.filter(p => p.platform === 'linkedin').length, color: 'bg-blue-500', percentage: (scheduledPosts.filter(p => p.platform === 'linkedin').length / contentStats.totalPosts) * 100 },
              { platform: 'YouTube', count: contentStats.videos, color: 'bg-red-500', percentage: (contentStats.videos / contentStats.totalPosts) * 100 },
              { platform: 'X/Twitter', count: scheduledPosts.filter(p => p.platform === 'twitter').length, color: 'bg-sky-500', percentage: (scheduledPosts.filter(p => p.platform === 'twitter').length / contentStats.totalPosts) * 100 },
            ].map((item) => (
              <div key={item.platform}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-medium text-slate-700">{item.platform}</span>
                  <span className="text-slate-600">{item.count} posts</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Automation Benefits</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">Content Variety</div>
                <div className="text-sm text-slate-600">5 different content types across platforms</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">Keyword Coverage</div>
                <div className="text-sm text-slate-600">All {keywords.length} keywords strategically used</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">Time Savings</div>
                <div className="text-sm text-slate-600">40+ hours saved per week on content creation</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">Consistent Publishing</div>
                <div className="text-sm text-slate-600">Automated scheduling ensures regular posting</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">AI Marketing Assistant</h3>
              <p className="text-sm text-slate-600 mt-1">Get help with your content planning</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Bot className="w-4 h-4" />
                {chatOpen ? 'Hide Assistant' : 'Show Assistant'}
              </button>
            </div>
          </div>
        </div>

        {chatOpen && (
          <div className="p-0">
            <AIAssistantChat />
          </div>
        )}
      </div>
    </div>
  );
}