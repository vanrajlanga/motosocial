import { Target, Zap, Globe, TrendingUp } from 'lucide-react';

export function Overview() {
  const highlights = [
    {
      icon: Zap,
      title: 'AI-Powered Automation',
      description: 'Leverage ChatGPT & Google Gemini for content generation',
      color: 'bg-yellow-100 text-yellow-700',
    },
    {
      icon: Globe,
      title: '5 Platform Integration',
      description: 'X, Facebook, Instagram, LinkedIn, YouTube',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: Target,
      title: '7 Core Engines',
      description: 'Complete marketing automation ecosystem',
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: TrendingUp,
      title: '10-Day Delivery',
      description: 'Fast implementation timeline',
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center pb-8 border-b border-slate-200">
        <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
          PROPOSAL DOCUMENT
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          AI Social Media + SEO Automation Module
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Enhance your existing Node.js backend with a comprehensive AI-powered marketing automation system
          that generates, schedules, and publishes content across multiple platforms.
        </p>
      </div>

      {/* Key Highlights */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          );
        })}
      </div>

      {/* Executive Summary */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Executive Summary</h3>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 leading-relaxed">
            This proposal outlines the development of an AI-powered marketing automation module for Motopsy CRM.
            The system will integrate seamlessly with your existing Node.js backend infrastructure to deliver
            comprehensive social media and SEO marketing capabilities.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-slate-900 mb-3">Project Objectives</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-slate-700">
                <strong>Automate Content Creation:</strong> Generate SEO blogs, social posts, and video scripts
                using AI
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-slate-700">
                <strong>Multi-Platform Publishing:</strong> Auto-publish across X, Facebook, Instagram, LinkedIn,
                and YouTube
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-slate-700">
                <strong>SEO Optimization:</strong> Discover keywords, analyze competitors, and optimize content
                for search engines
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-slate-700">
                <strong>Content Repurposing:</strong> Transform one topic into multiple content assets across
                different platforms
              </span>
            </li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-4">Supported Platforms</h4>
            <div className="space-y-3">
              {['X (Twitter)', 'Facebook', 'Instagram', 'LinkedIn', 'YouTube'].map((platform) => (
                <div key={platform} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700">{platform}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-4">AI Technologies</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700">OpenAI (ChatGPT)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700">Google Gemini</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700">ElevenLabs / Azure Voice</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700">DALL-E / Stable Diffusion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
