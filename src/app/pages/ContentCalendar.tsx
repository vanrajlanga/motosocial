import { useState } from 'react';
import { CalendarView } from '../components/CalendarView';
import { Calendar as CalendarIcon, Instagram, Linkedin, Twitter, Youtube, FileText, List, Grid } from 'lucide-react';

interface ScheduledPost {
  id: string;
  platform: string;
  type: string;
  title: string;
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'draft';
  keywords: string[];
}

export function ContentCalendar() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Calendar</h1>
          <p className="text-slate-600">View and manage all scheduled content</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Grid className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{contentStats.totalPosts}</p>
              <p className="text-sm text-slate-600">Total Posts</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{contentStats.blogs}</p>
              <p className="text-sm text-slate-600">Blogs</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{contentStats.social}</p>
              <p className="text-sm text-slate-600">Social Posts</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{contentStats.videos}</p>
              <p className="text-sm text-slate-600">Videos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <CalendarView posts={scheduledPosts} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg">Upcoming Content Schedule</h2>
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
                          <CalendarIcon className="w-4 h-4" />
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
      )}
    </div>
  );
}
