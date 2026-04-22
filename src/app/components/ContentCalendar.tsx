import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Calendar, CheckCircle } from 'lucide-react';

export function ContentCalendar() {
  const contentDistribution = [
    { name: 'SEO Blogs', value: 8, color: '#3b82f6' },
    { name: 'Instagram Reels', value: 12, color: '#ec4899' },
    { name: 'YouTube Videos', value: 4, color: '#ef4444' },
    { name: 'LinkedIn Posts', value: 12, color: '#0a66c2' },
    { name: 'Quora Answers', value: 20, color: '#b92b27' },
  ];

  const weeklySchedule = [
    {
      day: 'Monday',
      tasks: [
        { type: 'Blog', title: 'SEO keyword research & topic selection', color: 'bg-blue-100 text-blue-700' },
        { type: 'LinkedIn', title: 'Industry insights post', color: 'bg-blue-600 text-white' },
      ],
    },
    {
      day: 'Tuesday',
      tasks: [
        { type: 'Instagram', title: 'Educational reel about car inspection', color: 'bg-pink-100 text-pink-700' },
        { type: 'Quora', title: '2 answers on used car topics', color: 'bg-red-100 text-red-700' },
      ],
    },
    {
      day: 'Wednesday',
      tasks: [
        { type: 'Blog', title: 'Publish long-form SEO article', color: 'bg-blue-100 text-blue-700' },
        { type: 'LinkedIn', title: 'Case study post', color: 'bg-blue-600 text-white' },
      ],
    },
    {
      day: 'Thursday',
      tasks: [
        { type: 'Instagram', title: 'Quick tips reel', color: 'bg-pink-100 text-pink-700' },
        { type: 'YouTube', title: 'Long-form educational video', color: 'bg-red-100 text-red-700' },
      ],
    },
    {
      day: 'Friday',
      tasks: [
        { type: 'LinkedIn', title: 'Weekly roundup post', color: 'bg-blue-600 text-white' },
        { type: 'Quora', title: '3 detailed answers', color: 'bg-red-100 text-red-700' },
      ],
    },
  ];

  const contentPillars = [
    {
      name: 'Vehicle Verification',
      topics: ['RTO verification', 'Document authentication', 'History check'],
      color: 'border-blue-500',
    },
    {
      name: 'Inspection Guides',
      topics: ['Pre-purchase inspection', 'Engine check', 'Body condition'],
      color: 'border-green-500',
    },
    {
      name: 'Market Insights',
      topics: ['Pricing trends', 'Best buying times', 'Resale value'],
      color: 'border-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Content Strategy & Calendar</h2>
        <p className="text-slate-600">Automated weekly content production and distribution plan</p>
      </div>

      {/* Monthly Content Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">Monthly Content Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {contentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">Monthly Output Summary</h3>
          <div className="space-y-4">
            {contentDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium text-slate-900">{item.name}</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between">
              <span className="font-bold text-slate-900">Total Pieces</span>
              <span className="text-3xl font-bold text-blue-600">56</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Weekly Content Schedule</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {weeklySchedule.map((day) => (
              <div key={day.day} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {day.day}
                </div>
                <div className="space-y-2">
                  {day.tasks.map((task, idx) => (
                    <div key={idx} className={`${task.color} px-3 py-2 rounded-lg text-sm font-medium`}>
                      <span className="font-bold">{task.type}:</span> {task.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Pillars */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-xl">Content Pillar Strategy</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {contentPillars.map((pillar) => (
            <div key={pillar.name} className={`border-l-4 ${pillar.color} bg-slate-50 rounded-lg p-6`}>
              <h4 className="font-bold text-slate-900 mb-3">{pillar.name}</h4>
              <ul className="space-y-2">
                {pillar.topics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Flow */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4">Content Repurposing Flow</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {[
            { label: '1 Topic Selected', color: 'bg-blue-600' },
            { label: 'AI Generates Blog', color: 'bg-purple-600' },
            { label: 'Creates Social Posts', color: 'bg-pink-600' },
            { label: 'Generates Video', color: 'bg-red-600' },
            { label: 'Auto Publishes', color: 'bg-green-600' },
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`${step.color} text-white px-4 py-3 rounded-lg font-semibold text-center min-w-[140px]`}>
                {step.label}
              </div>
              {idx < 4 && <div className="hidden md:block text-slate-400 text-2xl">→</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
