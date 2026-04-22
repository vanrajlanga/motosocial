import { AIAssistantChat } from '../components/AIAssistantChat';
import { Bot, Sparkles, MessageSquare, Zap } from 'lucide-react';

export function AIAssistant() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Schedule Queries',
      description: 'Ask about this week, next week, or specific date ranges',
    },
    {
      icon: Sparkles,
      title: 'Platform Filters',
      description: 'View content by platform (Instagram, LinkedIn, YouTube, etc.)',
    },
    {
      icon: Zap,
      title: 'Keyword Search',
      description: 'Find all content targeting specific keywords',
    },
    {
      icon: Bot,
      title: 'Content Modifications',
      description: 'Request changes to titles, dates, or platforms',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Marketing Assistant</h1>
        <p className="text-slate-600">Get instant answers about your content schedule and planning</p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {/* AI Chat Interface */}
      <AIAssistantChat />

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-slate-900 mb-4">Example Questions You Can Ask:</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-700">💬 "What's scheduled for this week?"</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-700">💬 "Show me all Instagram posts"</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-700">💬 "Posts for 'vehicle history check India'"</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-700">💬 "Change the blog title to something catchier"</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-700">💬 "Show me next week's content"</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-700">💬 "List all LinkedIn articles"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
