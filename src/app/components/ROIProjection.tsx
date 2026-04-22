import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Clock, DollarSign, Users } from 'lucide-react';

export function ROIProjection() {
  const projectionData = [
    { month: 'Month 1', manual: 20, automated: 56, saved: 36 },
    { month: 'Month 2', manual: 20, automated: 112, saved: 92 },
    { month: 'Month 3', manual: 20, automated: 168, saved: 148 },
    { month: 'Month 4', manual: 20, automated: 224, saved: 204 },
    { month: 'Month 5', manual: 20, automated: 280, saved: 260 },
    { month: 'Month 6', manual: 20, automated: 336, saved: 316 },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Time Savings',
      value: '95%',
      description: 'Reduction in content creation time',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: DollarSign,
      title: 'Cost Efficiency',
      value: '$5K+',
      description: 'Monthly savings on content team',
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: TrendingUp,
      title: 'Content Output',
      value: '14x',
      description: 'Increase in weekly content production',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      icon: Users,
      title: 'Reach Growth',
      value: '300%',
      description: 'Projected audience growth in 6 months',
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">ROI & Impact Projection</h2>
        <p className="text-slate-600">Expected returns and business impact over 6 months</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div key={benefit.title} className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 rounded-lg ${benefit.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{benefit.value}</div>
              <div className="font-semibold text-slate-900 mb-1">{benefit.title}</div>
              <p className="text-sm text-slate-600">{benefit.description}</p>
            </div>
          );
        })}
      </div>

      {/* Content Production Graph */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-6">Content Production Comparison (Pieces/Month)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
            <YAxis tick={{ fill: '#64748b' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="manual"
              stroke="#ef4444"
              strokeWidth={3}
              name="Manual Process"
              dot={{ fill: '#ef4444', r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="automated"
              stroke="#10b981"
              strokeWidth={3}
              name="Automated System"
              dot={{ fill: '#10b981', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Content Output */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4">Weekly Content Output (Automated)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">2</div>
            <div className="text-sm text-slate-700">SEO Blogs</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-pink-600 mb-1">3</div>
            <div className="text-sm text-slate-700">Instagram Reels</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600 mb-1">1</div>
            <div className="text-sm text-slate-700">YouTube Video</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-700 mb-1">3</div>
            <div className="text-sm text-slate-700">LinkedIn Posts</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">5</div>
            <div className="text-sm text-slate-700">Quora Answers</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-2xl font-bold text-slate-900">14</span>
          <span className="text-slate-600 ml-2">total pieces per week</span>
        </div>
      </div>

      {/* Investment Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Investment Required</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-700">Development (10 days)</span>
              <span className="font-semibold text-slate-900">Included</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-700">AI API costs (monthly)</span>
              <span className="font-semibold text-slate-900">~$200-500</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-700">Social Media APIs</span>
              <span className="font-semibold text-slate-900">Free tier</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-slate-900">Total Monthly Cost</span>
              <span className="text-lg font-bold text-green-600">~$200-500</span>
            </div>
          </div>
        </div>

        <div className="border border-green-200 bg-green-50 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Value Generated</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-green-200">
              <span className="text-slate-700">Content team cost saved</span>
              <span className="font-semibold text-slate-900">$5,000+/mo</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-green-200">
              <span className="text-slate-700">Time saved (hours/week)</span>
              <span className="font-semibold text-slate-900">40+ hours</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-green-200">
              <span className="text-slate-700">SEO traffic increase</span>
              <span className="font-semibold text-slate-900">200-300%</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-slate-900">ROI (6 months)</span>
              <span className="text-lg font-bold text-green-600">1000%+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
