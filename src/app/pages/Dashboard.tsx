import { Link } from 'react-router';
import { Target, Calendar, Bot, Sparkles, TrendingUp, Clock, CheckCircle2, ArrowRight, Plus, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { CreatePostModal } from '../components/CreatePostModal';
import { signOut, getCurrentUser } from '../utils/authService';

export function Dashboard() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      signOut();
    }
  };

  const stats = [
    {
      label: 'Keywords Targeted',
      value: '12',
      change: '+3 this week',
      color: 'from-purple-500 to-purple-600',
      icon: Target,
    },
    {
      label: 'Posts Scheduled',
      value: '47',
      change: 'Next 30 days',
      color: 'from-blue-500 to-blue-600',
      icon: Calendar,
    },
    {
      label: 'Content Generated',
      value: '156',
      change: 'All time',
      color: 'from-green-500 to-green-600',
      icon: Sparkles,
    },
    {
      label: 'Automation Rate',
      value: '95%',
      change: 'Time saved',
      color: 'from-orange-500 to-orange-600',
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      title: 'Add Keywords',
      description: 'Target new keywords for content generation',
      icon: Target,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      link: '/keywords',
    },
    {
      title: 'View Calendar',
      description: 'See all scheduled posts',
      icon: Calendar,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      link: '/calendar',
    },
    {
      title: 'Ask AI Assistant',
      description: 'Get help with content planning',
      icon: Bot,
      color: 'bg-green-100 text-green-700 border-green-300',
      link: '/ai-assistant',
    },
    {
      title: 'Create Content',
      description: 'Generate images, videos, or articles',
      icon: Sparkles,
      color: 'bg-pink-100 text-pink-700 border-pink-300',
      link: '/content-manager',
    },
  ];

  const recentActivity = [
    {
      action: 'Blog post published',
      title: 'Complete Guide to Vehicle History Check in India',
      time: '2 hours ago',
      status: 'success',
    },
    {
      action: 'Instagram reel scheduled',
      title: '5 Red Flags in Used Car History Reports',
      time: '5 hours ago',
      status: 'scheduled',
    },
    {
      action: 'Keyword added',
      title: 'RTO verification online',
      time: '1 day ago',
      status: 'info',
    },
    {
      action: 'YouTube video generated',
      title: 'Step-by-Step Car Inspection Checklist',
      time: '2 days ago',
      status: 'success',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Motopsy AI Marketing</h1>
            <p className="text-blue-100 text-lg">
              Your automated content engine is running. Let's grow your presence!
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.change}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-blue-300 group"
              >
                <div className={`w-12 h-12 rounded-lg border ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{action.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{action.description}</p>
                <div className="flex items-center text-blue-600 text-sm font-semibold">
                  <span>Go</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Upcoming Posts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.status === 'success' ? 'bg-green-500' :
                    item.status === 'scheduled' ? 'bg-blue-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.action}</p>
                    <p className="text-sm text-slate-600">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* This Week's Schedule */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg">This Week's Schedule</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Monday, Mar 17</p>
                  <p className="text-sm text-slate-600">LinkedIn Post - RTO Verification</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-pink-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Tuesday, Mar 18</p>
                  <p className="text-sm text-slate-600">YouTube Video - Inspection Guide</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Thursday, Mar 20</p>
                  <p className="text-sm text-slate-600">Blog - RTO Verification Process</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <Link
                to="/calendar"
                className="block text-center py-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                View Full Calendar →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => setShowCreatePost(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          <Plus className="w-6 h-6" />
          Create New Post
        </button>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />

      {/* Logout Button */}
      <div className="text-center mt-8">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          <LogOut className="w-6 h-6" />
          Logout
        </button>
      </div>

      {/* User Profile */}
      <div className="text-center mt-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105">
          <User className="w-6 h-6" />
          {currentUser ? currentUser.name : 'User'}
        </div>
      </div>
    </div>
  );
}