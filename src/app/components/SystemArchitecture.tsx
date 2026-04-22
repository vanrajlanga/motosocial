import { Database, Server, Cloud, Cpu, Share2, BarChart3, Users } from 'lucide-react';

export function SystemArchitecture() {
  const databases = [
    { collection: 'topics', fields: ['id', 'topic_name', 'pillar', 'keyword', 'status', 'created_at'] },
    { collection: 'keywords', fields: ['id', 'keyword', 'difficulty', 'search_volume', 'intent', 'cluster'] },
    { collection: 'blogs', fields: ['id', 'title', 'content', 'seo_keywords', 'slug', 'published'] },
    { collection: 'social_posts', fields: ['id', 'platform', 'content', 'media', 'scheduled_time', 'status'] },
    { collection: 'videos', fields: ['id', 'title', 'script', 'youtube_url', 'status'] },
    { collection: 'analytics', fields: ['post_id', 'platform', 'impressions', 'clicks', 'engagement'] },
  ];

  const apiIntegrations = [
    {
      category: 'AI APIs',
      icon: Cpu,
      color: 'bg-purple-100 text-purple-700',
      apis: ['ChatGPT API', 'Google Gemini API', 'ElevenLabs Voice', 'DALL-E / Stable Diffusion'],
    },
    {
      category: 'Social Media APIs',
      icon: Share2,
      color: 'bg-blue-100 text-blue-700',
      apis: ['Facebook Graph API', 'Instagram Graph API', 'LinkedIn API', 'X (Twitter) API', 'YouTube Data API'],
    },
    {
      category: 'SEO & Analytics',
      icon: BarChart3,
      color: 'bg-green-100 text-green-700',
      apis: ['Google Search Console', 'Ahrefs API (Optional)', 'SerpAPI (Optional)'],
    },
  ];

  const userRoles = [
    {
      role: 'Admin',
      permissions: ['Full system access', 'User management', 'System configuration', 'API key management'],
      color: 'border-red-500',
    },
    {
      role: 'Marketing Manager',
      permissions: ['Create topics', 'Approve content', 'Schedule posts', 'View analytics'],
      color: 'border-blue-500',
    },
    {
      role: 'Content Editor',
      permissions: ['Edit AI content', 'Review blogs', 'Manage social posts', 'Basic analytics'],
      color: 'border-green-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">System Architecture</h2>
        <p className="text-slate-600">Technical infrastructure and data flow design</p>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-8 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-6 text-center">Complete Automation Workflow</h3>
        <div className="flex flex-col gap-3">
          {[
            { step: 'Topic discovered', color: 'bg-blue-600' },
            { step: 'SEO keywords generated', color: 'bg-purple-600' },
            { step: 'Competitor content analyzed', color: 'bg-pink-600' },
            { step: 'AI blog generated', color: 'bg-indigo-600' },
            { step: 'Social media posts created', color: 'bg-blue-500' },
            { step: 'YouTube video generated', color: 'bg-red-600' },
            { step: 'Content scheduled', color: 'bg-orange-600' },
            { step: 'Published automatically', color: 'bg-green-600' },
            { step: 'Analytics tracked', color: 'bg-teal-600' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className={`${item.color} text-white px-6 py-3 rounded-lg font-semibold flex-1 text-center shadow-md`}>
                {item.step}
              </div>
              {idx < 8 && (
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                  <div className="text-slate-400">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Database Structure */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-6 h-6 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-xl">Database Collections (MongoDB)</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {databases.map((db) => (
            <div key={db.collection} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
              <div className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                {db.collection}
              </div>
              <div className="space-y-1">
                {db.fields.map((field) => (
                  <div key={field} className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded">
                    {field}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Integrations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-6 h-6 text-purple-600" />
          <h3 className="font-bold text-slate-900 text-xl">API Integrations</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {apiIntegrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <div key={integration.category} className="border border-slate-200 rounded-xl p-6 bg-white">
                <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-3">{integration.category}</h4>
                <ul className="space-y-2">
                  {integration.apis.map((api) => (
                    <li key={api} className="flex items-center gap-2 text-sm text-slate-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      {api}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Roles & Permissions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-green-600" />
          <h3 className="font-bold text-slate-900 text-xl">User Roles & Permissions</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {userRoles.map((user) => (
            <div key={user.role} className={`border-l-4 ${user.color} bg-slate-50 rounded-lg p-6`}>
              <h4 className="font-bold text-slate-900 mb-3 text-lg">{user.role}</h4>
              <ul className="space-y-2">
                {user.permissions.map((permission) => (
                  <li key={permission} className="flex items-start gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5"></div>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Features */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4">Admin Dashboard Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-1">42</div>
            <div className="text-sm text-slate-700">Blogs Published</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-pink-600 mb-1">120</div>
            <div className="text-sm text-slate-700">Social Posts</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-red-600 mb-1">15</div>
            <div className="text-sm text-slate-700">YouTube Videos</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-1">340</div>
            <div className="text-sm text-slate-700">Keywords Discovered</div>
          </div>
        </div>
      </div>
    </div>
  );
}
