import { Database, Cloud, Cpu, Share2 } from 'lucide-react';

export function TechStack() {
  const stack = {
    backend: [
      { name: 'Node.js', description: 'Existing backend (enhanced)' },
      { name: 'Express.js', description: 'API framework' },
      { name: 'MongoDB', description: 'Database' },
    ],
    ai: [
      { name: 'OpenAI API', description: 'ChatGPT integration' },
      { name: 'Google Gemini', description: 'Alternative AI engine' },
      { name: 'ElevenLabs', description: 'Voice generation' },
      { name: 'DALL-E', description: 'Image generation' },
    ],
    social: [
      { name: 'Facebook Graph API', description: 'FB & Instagram' },
      { name: 'LinkedIn API', description: 'LinkedIn posts' },
      { name: 'X API', description: 'Twitter integration' },
      { name: 'YouTube Data API', description: 'Video uploads' },
    ],
    tools: [
      { name: 'FFmpeg', description: 'Video processing' },
      { name: 'Puppeteer', description: 'Web scraping' },
      { name: 'Bull Queue', description: 'Job scheduling' },
      { name: 'Redis', description: 'Caching' },
    ],
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Technology Stack</h2>
        <p className="text-slate-600">Comprehensive technical architecture</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Backend & Database</h3>
          </div>
          <div className="space-y-3">
            {stack.backend.map((tech) => (
              <div key={tech.name} className="flex justify-between items-center">
                <span className="font-medium text-slate-900">{tech.name}</span>
                <span className="text-sm text-slate-600">{tech.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">AI & Machine Learning</h3>
          </div>
          <div className="space-y-3">
            {stack.ai.map((tech) => (
              <div key={tech.name} className="flex justify-between items-center">
                <span className="font-medium text-slate-900">{tech.name}</span>
                <span className="text-sm text-slate-600">{tech.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Social Media APIs</h3>
          </div>
          <div className="space-y-3">
            {stack.social.map((tech) => (
              <div key={tech.name} className="flex justify-between items-center">
                <span className="font-medium text-slate-900">{tech.name}</span>
                <span className="text-sm text-slate-600">{tech.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Supporting Tools</h3>
          </div>
          <div className="space-y-3">
            {stack.tools.map((tech) => (
              <div key={tech.name} className="flex justify-between items-center">
                <span className="font-medium text-slate-900">{tech.name}</span>
                <span className="text-sm text-slate-600">{tech.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
