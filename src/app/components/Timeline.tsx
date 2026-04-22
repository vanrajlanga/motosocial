import { CheckCircle2, Circle } from 'lucide-react';

export function Timeline() {
  const timeline = [
    {
      day: 'Day 1',
      title: 'System Architecture + Database',
      tasks: [
        'Design database schema',
        'Setup MongoDB collections',
        'Create API structure',
        'Configure environment',
      ],
      status: 'planned',
    },
    {
      day: 'Day 2',
      title: 'ChatGPT + Gemini API Integration',
      tasks: [
        'Setup OpenAI API',
        'Configure Google Gemini',
        'Test AI responses',
        'Create prompt templates',
      ],
      status: 'planned',
    },
    {
      day: 'Day 3',
      title: 'SEO Keyword Discovery Engine',
      tasks: [
        'Build keyword generator',
        'Implement search intent classifier',
        'Add difficulty estimator',
        'Create clustering algorithm',
      ],
      status: 'planned',
    },
    {
      day: 'Day 4',
      title: 'Competitor Content Analysis Engine',
      tasks: [
        'Setup web scraping',
        'Parse competitor data',
        'Build trend analyzer',
        'Implement gap detection',
      ],
      status: 'planned',
    },
    {
      day: 'Day 5',
      title: 'AI Blog Generator',
      tasks: [
        'Create blog generation flow',
        'Add SEO optimization',
        'Implement meta tag generator',
        'Setup internal linking',
      ],
      status: 'planned',
    },
    {
      day: 'Day 6',
      title: 'Social Media API Integration',
      tasks: [
        'Facebook Graph API',
        'Instagram API',
        'LinkedIn API',
        'X (Twitter) API',
      ],
      status: 'planned',
    },
    {
      day: 'Day 7',
      title: 'Auto Scheduling System',
      tasks: [
        'Build content calendar',
        'Create scheduling engine',
        'Implement queue system',
        'Add time zone support',
      ],
      status: 'planned',
    },
    {
      day: 'Day 8',
      title: 'YouTube Video Creation Engine',
      tasks: [
        'Script generation',
        'AI voiceover integration',
        'Video assembly pipeline',
        'YouTube upload automation',
      ],
      status: 'planned',
    },
    {
      day: 'Day 9',
      title: 'Analytics Dashboard',
      tasks: [
        'Build admin panel',
        'Create analytics widgets',
        'Setup reporting system',
        'Add user permissions',
      ],
      status: 'planned',
    },
    {
      day: 'Day 10',
      title: 'Testing + Deployment',
      tasks: [
        'End-to-end testing',
        'Performance optimization',
        'Security audit',
        'Production deployment',
      ],
      status: 'planned',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">10-Day Development Timeline</h2>
        <p className="text-slate-600">Structured sprint plan for rapid implementation</p>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Project Duration</h3>
          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">10 Days</span>
        </div>
        <div className="relative">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-0 animate-[progress_2s_ease-out_forwards]"></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>Start</span>
            <span>Day 5</span>
            <span>Completion</span>
          </div>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="space-y-4">
        {timeline.map((item, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-blue-300"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold text-blue-600">{item.day}</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{item.title}</h3>
                  </div>
                  <Circle className="w-5 h-5 text-slate-300" />
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {item.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4">Key Milestones</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">Day 5</div>
            <p className="text-sm text-slate-700">Core AI features complete</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">Day 8</div>
            <p className="text-sm text-slate-700">All integrations working</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="text-2xl font-bold text-green-600 mb-1">Day 10</div>
            <p className="text-sm text-slate-700">Production ready</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
