import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Calendar, Instagram, Linkedin, Twitter, Youtube, FileText, TrendingUp } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'schedule' | 'list';
  data?: any;
}

export function AIAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your AI Marketing Assistant. I can help you with:\n\n✅ View schedules (this week, next week)\n✅ Filter by keywords or platforms\n✅ Make changes to upcoming posts\n✅ Provide content insights\n\nTry asking: \"What's scheduled for this week?\" or \"Show me Instagram posts\"",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'text',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    "What's scheduled for this week?",
    "Show me Instagram posts",
    "Posts for 'vehicle history check India'",
    "Change blog title to something catchier",
  ];

  const handleSendMessage = (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = getAIResponse(messageText.toLowerCase());
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (query: string): ChatMessage => {
    const baseTimestamp = new Date().toISOString();

    // This week schedule
    if (query.includes('this week') || query.includes('schedule') && query.includes('week')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here's your content schedule for this week (Mar 10-16, 2026):",
        timestamp: baseTimestamp,
        type: 'schedule',
        data: {
          posts: [
            {
              date: 'Mar 15 (Sat)',
              platform: 'blog',
              title: 'Complete Guide to Vehicle History Check in India',
              icon: 'FileText',
              color: 'purple',
            },
            {
              date: 'Mar 16 (Sun)',
              platform: 'instagram',
              title: '5 Red Flags in Used Car History Reports',
              icon: 'Instagram',
              color: 'pink',
            },
          ],
          summary: "📊 Total: 2 posts\n📝 1 Blog, 1 Instagram Reel",
        },
      };
    }

    // Next week schedule
    if (query.includes('next week')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here's your content schedule for next week (Mar 17-23, 2026):",
        timestamp: baseTimestamp,
        type: 'schedule',
        data: {
          posts: [
            {
              date: 'Mar 17 (Mon)',
              platform: 'linkedin',
              title: 'Why RTO Verification is Critical Before Buying Used Cars',
              icon: 'Linkedin',
              color: 'blue',
            },
            {
              date: 'Mar 18 (Tue)',
              platform: 'youtube',
              title: 'Step-by-Step Car Inspection Checklist for Buyers',
              icon: 'Youtube',
              color: 'red',
            },
            {
              date: 'Mar 20 (Thu)',
              platform: 'blog',
              title: 'Understanding RTO Verification Process Online',
              icon: 'FileText',
              color: 'purple',
            },
            {
              date: 'Mar 21 (Fri)',
              platform: 'twitter',
              title: 'Thread: Top 10 Things to Check in Used Car Inspection',
              icon: 'Twitter',
              color: 'sky',
            },
            {
              date: 'Mar 22 (Sat)',
              platform: 'instagram',
              title: 'Infographic: Car Inspection Checklist',
              icon: 'Instagram',
              color: 'pink',
            },
          ],
          summary: "📊 Total: 5 posts\n📝 1 Blog, 1 YouTube, 1 LinkedIn, 1 Twitter, 1 Instagram",
        },
      };
    }

    // Instagram posts
    if (query.includes('instagram')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here are all scheduled Instagram posts:",
        timestamp: baseTimestamp,
        type: 'list',
        data: {
          items: [
            {
              title: '5 Red Flags in Used Car History Reports',
              date: 'Mar 16, 2026',
              keywords: ['vehicle history check India'],
              status: 'scheduled',
            },
            {
              title: 'Infographic: Car Inspection Checklist',
              date: 'Mar 22, 2026',
              keywords: ['used car inspection checklist'],
              status: 'draft',
            },
          ],
          summary: "📱 Total: 2 Instagram posts (1 reel, 1 post)\n✅ 1 Scheduled, 📝 1 Draft",
        },
      };
    }

    // LinkedIn posts
    if (query.includes('linkedin')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here are all scheduled LinkedIn posts:",
        timestamp: baseTimestamp,
        type: 'list',
        data: {
          items: [
            {
              title: 'Why RTO Verification is Critical Before Buying Used Cars',
              date: 'Mar 17, 2026',
              keywords: ['RTO verification online'],
              status: 'scheduled',
            },
            {
              title: 'The Future of Vehicle Verification in India',
              date: 'Mar 24, 2026',
              keywords: ['vehicle history check India', 'RTO verification online'],
              status: 'scheduled',
            },
          ],
          summary: "💼 Total: 2 LinkedIn posts\n✅ All Scheduled",
        },
      };
    }

    // YouTube posts
    if (query.includes('youtube') || query.includes('video')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here are all scheduled YouTube videos:",
        timestamp: baseTimestamp,
        type: 'list',
        data: {
          items: [
            {
              title: 'Step-by-Step Car Inspection Checklist for Buyers',
              date: 'Mar 18, 2026',
              keywords: ['used car inspection checklist'],
              status: 'scheduled',
            },
          ],
          summary: "🎥 Total: 1 YouTube video\n✅ Scheduled",
        },
      };
    }

    // Blog posts
    if (query.includes('blog')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Here are all scheduled blog posts:",
        timestamp: baseTimestamp,
        type: 'list',
        data: {
          items: [
            {
              title: 'Complete Guide to Vehicle History Check in India',
              date: 'Mar 15, 2026',
              keywords: ['vehicle history check India', 'RTO verification online'],
              status: 'scheduled',
            },
            {
              title: 'Understanding RTO Verification Process Online',
              date: 'Mar 20, 2026',
              keywords: ['RTO verification online'],
              status: 'scheduled',
            },
          ],
          summary: "📝 Total: 2 SEO blogs\n✅ All Scheduled",
        },
      };
    }

    // Specific keyword search
    if (query.includes('vehicle history') || query.includes('rto verification') || query.includes('inspection checklist')) {
      const keyword = query.includes('vehicle history') ? 'vehicle history check India' :
                     query.includes('rto') ? 'RTO verification online' : 'used car inspection checklist';
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here are all posts targeting "${keyword}":`,
        timestamp: baseTimestamp,
        type: 'list',
        data: {
          items: keyword === 'vehicle history check India' ? [
            {
              title: 'Complete Guide to Vehicle History Check in India',
              date: 'Mar 15, 2026',
              platform: 'Blog',
              status: 'scheduled',
            },
            {
              title: '5 Red Flags in Used Car History Reports',
              date: 'Mar 16, 2026',
              platform: 'Instagram Reel',
              status: 'scheduled',
            },
            {
              title: 'The Future of Vehicle Verification in India',
              date: 'Mar 24, 2026',
              platform: 'LinkedIn',
              status: 'scheduled',
            },
          ] : keyword === 'RTO verification online' ? [
            {
              title: 'Complete Guide to Vehicle History Check in India',
              date: 'Mar 15, 2026',
              platform: 'Blog',
              status: 'scheduled',
            },
            {
              title: 'Why RTO Verification is Critical Before Buying Used Cars',
              date: 'Mar 17, 2026',
              platform: 'LinkedIn',
              status: 'scheduled',
            },
            {
              title: 'Understanding RTO Verification Process Online',
              date: 'Mar 20, 2026',
              platform: 'Blog',
              status: 'scheduled',
            },
          ] : [
            {
              title: 'Step-by-Step Car Inspection Checklist for Buyers',
              date: 'Mar 18, 2026',
              platform: 'YouTube',
              status: 'scheduled',
            },
            {
              title: 'Thread: Top 10 Things to Check in Used Car Inspection',
              date: 'Mar 21, 2026',
              platform: 'Twitter',
              status: 'scheduled',
            },
            {
              title: 'Infographic: Car Inspection Checklist',
              date: 'Mar 22, 2026',
              platform: 'Instagram',
              status: 'draft',
            },
          ],
          summary: `🎯 Found ${keyword === 'vehicle history check India' ? 3 : keyword === 'RTO verification online' ? 3 : 3} posts targeting this keyword`,
        },
      };
    }

    // Change/edit request
    if (query.includes('change') || query.includes('edit') || query.includes('update') || query.includes('modify')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "✅ I can help you make changes! Here's what I can do:\n\n1️⃣ **Edit Title**: Change any post title\n2️⃣ **Reschedule**: Move posts to different dates\n3️⃣ **Change Platform**: Convert content for different platforms\n4️⃣ **Update Keywords**: Add or remove target keywords\n5️⃣ **Regenerate Content**: Create new variations\n\nPlease specify:\n- Which post you want to change?\n- What changes you'd like to make?\n\nExample: \"Change the Instagram post title on Mar 16 to 'Top 5 Warning Signs in Car History Reports'\"",
        timestamp: baseTimestamp,
        type: 'text',
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: "I can help you with:\n\n📅 **Schedule Queries**:\n- \"What's scheduled for this week?\"\n- \"Show me next week's posts\"\n\n🎯 **Platform Filters**:\n- \"Show me Instagram posts\"\n- \"List all LinkedIn content\"\n\n🔍 **Keyword Search**:\n- \"Posts for 'vehicle history check India'\"\n- \"Content targeting RTO verification\"\n\n✏️ **Make Changes**:\n- \"Change blog title to...\"\n- \"Reschedule YouTube video to Friday\"\n\nWhat would you like to know?",
      timestamp: baseTimestamp,
      type: 'text',
    };
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      FileText,
      Instagram,
      Linkedin,
      Twitter,
      Youtube,
    };
    const Icon = icons[iconName] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      pink: 'bg-pink-100 text-pink-700 border-pink-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      red: 'bg-red-100 text-red-700 border-red-300',
      sky: 'bg-sky-100 text-sky-700 border-sky-300',
    };
    return colors[color] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Marketing Assistant</h3>
            <p className="text-sm text-white/80">Ask me about your content schedule</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-[500px] overflow-y-auto p-6 bg-slate-50">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div>
                  <div
                    className={`rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    
                    {/* Schedule View */}
                    {msg.type === 'schedule' && msg.data && (
                      <div className="mt-3 space-y-2">
                        {msg.data.posts.map((post: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-start gap-2">
                              <div className={`px-2 py-1 rounded border text-xs font-semibold flex items-center gap-1 ${getColorClasses(post.color)}`}>
                                {getIconComponent(post.icon)}
                                {post.platform.toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-slate-600 mb-1">{post.date}</div>
                                <div className="text-sm font-medium text-slate-900">{post.title}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mt-3">
                          <p className="text-xs text-blue-900 whitespace-pre-line">{msg.data.summary}</p>
                        </div>
                      </div>
                    )}

                    {/* List View */}
                    {msg.type === 'list' && msg.data && (
                      <div className="mt-3 space-y-2">
                        {msg.data.items.map((item: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="text-sm font-medium text-slate-900 flex-1">{item.title}</div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                item.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mb-2">📅 {item.date}</div>
                            {item.keywords && (
                              <div className="flex flex-wrap gap-1">
                                {item.keywords.map((kw: string, kidx: number) => (
                                  <span key={kidx} className="px-2 py-0.5 bg-white text-slate-700 rounded text-xs border border-slate-200">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.platform && (
                              <div className="text-xs text-slate-600 mt-1">🎯 {item.platform}</div>
                            )}
                          </div>
                        ))}
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 mt-3">
                          <p className="text-xs text-green-900 whitespace-pre-line">{msg.data.summary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-slate-500 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-6 py-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-slate-700">Quick Questions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about schedules, platforms, keywords..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
