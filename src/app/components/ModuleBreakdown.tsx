import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bot, Search, Target, FileText, Share2, Video, Repeat } from 'lucide-react';

export function ModuleBreakdown() {
  const modules = [
    {
      id: 1,
      icon: Bot,
      name: 'AI Content Engine',
      description: 'Generate SEO blogs, social posts, Twitter threads, YouTube scripts, and Quora answers',
      features: [
        'Multi-platform content generation',
        'Brand voice consistency',
        'Automated copywriting',
        'Content optimization',
      ],
      complexity: 85,
      color: '#3b82f6',
    },
    {
      id: 2,
      icon: Search,
      name: 'SEO Keyword Discovery',
      description: 'Automatically discover high-intent keywords related to used cars and vehicle verification',
      features: [
        'Keyword generation',
        'Search intent classification',
        'Difficulty estimation',
        'Keyword clustering',
      ],
      complexity: 70,
      color: '#10b981',
    },
    {
      id: 3,
      icon: Target,
      name: 'Competitor Analysis',
      description: 'Analyze competitors (Cars24, Spinny, CarDekho) and identify content gaps',
      features: [
        'Content scraping',
        'Trend identification',
        'Gap analysis',
        'Opportunity discovery',
      ],
      complexity: 75,
      color: '#f59e0b',
    },
    {
      id: 4,
      icon: FileText,
      name: 'Blog Automation',
      description: 'Generate SEO-optimized blogs with automatic publishing to motopsy.com',
      features: [
        'SEO optimization',
        'Meta tag generation',
        'Internal linking',
        'Auto-publishing',
      ],
      complexity: 80,
      color: '#8b5cf6',
    },
    {
      id: 5,
      icon: Share2,
      name: 'Social Media Engine',
      description: 'Auto-generate and publish posts across Instagram, Facebook, LinkedIn, and X',
      features: [
        'Multi-platform posting',
        'Hashtag generation',
        'Scheduling system',
        'Bulk publishing',
      ],
      complexity: 90,
      color: '#ec4899',
    },
    {
      id: 6,
      icon: Video,
      name: 'YouTube Video Creator',
      description: 'Automatically generate YouTube videos from blog topics with AI voiceovers',
      features: [
        'Script generation',
        'AI voiceover',
        'Video creation',
        'Auto upload to YouTube',
      ],
      complexity: 95,
      color: '#ef4444',
    },
    {
      id: 7,
      icon: Repeat,
      name: 'Content Repurposing',
      description: 'Transform one topic into multiple content assets across all platforms',
      features: [
        'Cross-platform adaptation',
        'Format conversion',
        'Asset management',
        'Unified workflow',
      ],
      complexity: 65,
      color: '#06b6d4',
    },
  ];

  const complexityData = modules.map((m) => ({
    name: m.name.split(' ')[0] + ' ' + m.name.split(' ')[1],
    complexity: m.complexity,
    color: m.color,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">7 Core Module Engines</h2>
        <p className="text-slate-600">Comprehensive breakdown of each automation component</p>
      </div>

      {/* Complexity Chart */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-6">Development Complexity by Module</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={complexityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: '#64748b' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="complexity" radius={[8, 8, 0, 0]}>
              {complexityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Module Details */}
      <div className="space-y-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: module.color + '20', color: module.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {module.id}. {module.name}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: module.color + '20', color: module.color }}
                    >
                      {module.complexity}% Complexity
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4">{module.description}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {module.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: module.color }}
                        ></div>
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
