import { useState, useEffect } from 'react';
import { Image, Video, FileText, Sparkles, Wand2, Download, AlertCircle, X, Edit, RotateCcw, Check, Lightbulb, Zap } from 'lucide-react';
import { generateImage, generateArticle, generateVideoScript, getAPIKeys } from '../utils/apiService';

type ContentType = 'image' | 'video' | 'article';

// API Status Indicator Component
function APIStatusIndicator() {
  const keys = getAPIKeys();
  const hasGemini = !!keys.gemini;
  const hasOpenAI = !!keys.openai || !!keys.dalle;
  
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
      <Zap className="w-5 h-5 text-green-600" />
      <div>
        <p className="text-sm font-semibold text-green-900">
          {hasGemini ? 'Gemini AI Active' : hasOpenAI ? 'OpenAI Active' : 'Free Mode Active'}
        </p>
        <p className="text-xs text-green-700">
          {hasGemini ? 'Enhanced prompts + Free image generation' : 
           hasOpenAI ? 'DALL-E 3 for premium images' : 
           'Free image generation available - no API key needed!'}
        </p>
      </div>
    </div>
  );
}

export function ContentManager() {
  const [activeTab, setActiveTab] = useState<ContentType>('article');
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [articleTopic, setArticleTopic] = useState('');
  const [articleKeywords, setArticleKeywords] = useState('');
  const [wordCount, setWordCount] = useState('800-1200 words');
  const [tone, setTone] = useState('Professional');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [videoDuration, setVideoDuration] = useState('60 seconds');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generated content
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);
  const [generatedVideoScript, setGeneratedVideoScript] = useState<string | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editSuggestion, setEditSuggestion] = useState('');
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [detectedImageType, setDetectedImageType] = useState<string | null>(null);
  const [suggestedSizes, setSuggestedSizes] = useState<string[]>(['1024x1024']);

  // Detect image type and suggest sizes based on prompt
  const detectImageTypeAndSizes = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Logo detection
    if (lowerPrompt.includes('logo') || lowerPrompt.includes('brand mark') || lowerPrompt.includes('icon')) {
      setDetectedImageType('Logo');
      setSuggestedSizes(['1024x1024', '1792x1024']);
      setImageSize('1024x1024');
      return;
    }
    
    // Social media posts
    if (lowerPrompt.includes('instagram post') || lowerPrompt.includes('social media post')) {
      setDetectedImageType('Instagram Post');
      setSuggestedSizes(['1024x1024']);
      setImageSize('1024x1024');
      return;
    }
    
    if (lowerPrompt.includes('instagram story') || lowerPrompt.includes('story')) {
      setDetectedImageType('Instagram Story');
      setSuggestedSizes(['1024x1792']);
      setImageSize('1024x1792');
      return;
    }
    
    // Banner/Header
    if (lowerPrompt.includes('banner') || lowerPrompt.includes('header') || lowerPrompt.includes('cover')) {
      setDetectedImageType('Banner/Header');
      setSuggestedSizes(['1792x1024']);
      setImageSize('1792x1024');
      return;
    }
    
    // Thumbnail
    if (lowerPrompt.includes('thumbnail') || lowerPrompt.includes('youtube')) {
      setDetectedImageType('Thumbnail');
      setSuggestedSizes(['1792x1024']);
      setImageSize('1792x1024');
      return;
    }
    
    // Portrait/Profile
    if (lowerPrompt.includes('portrait') || lowerPrompt.includes('profile') || lowerPrompt.includes('person')) {
      setDetectedImageType('Portrait');
      setSuggestedSizes(['1024x1792']);
      setImageSize('1024x1792');
      return;
    }
    
    // Infographic
    if (lowerPrompt.includes('infographic') || lowerPrompt.includes('chart') || lowerPrompt.includes('diagram')) {
      setDetectedImageType('Infographic');
      setSuggestedSizes(['1024x1792', '1024x1024']);
      setImageSize('1024x1792');
      return;
    }
    
    // Default
    setDetectedImageType('General Image');
    setSuggestedSizes(['1024x1024', '1024x1792', '1792x1024']);
    setImageSize('1024x1024');
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('Please enter an image description');
      return;
    }

    setGenerating(true);
    setError(null);
    
    try {
      const imageUrl = await generateImage(imagePrompt, imageSize);
      setGeneratedImage(imageUrl);
      setImageHistory([...imageHistory, imageUrl]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleModifyImage = async () => {
    if (!editSuggestion.trim()) {
      setError('Please enter modification suggestions');
      return;
    }

    const keys = getAPIKeys();
    if (!keys.openai && !keys.dalle) {
      setError('Please configure your OpenAI API key in Settings first');
      return;
    }

    setGenerating(true);
    setError(null);
    
    try {
      // Combine original prompt with modification suggestion
      const modifiedPrompt = `${imagePrompt}. ${editSuggestion}`;
      const imageUrl = await generateImage(modifiedPrompt, imageSize);
      setGeneratedImage(imageUrl);
      setImageHistory([...imageHistory, imageUrl]);
      setEditSuggestion('');
      setIsEditingImage(false);
    } catch (err: any) {
      setError(err.message || 'Failed to modify image');
    } finally {
      setGenerating(false);
    }
  };

  const handleUndoImage = () => {
    if (imageHistory.length > 1) {
      const newHistory = [...imageHistory];
      newHistory.pop();
      setImageHistory(newHistory);
      setGeneratedImage(newHistory[newHistory.length - 1]);
    }
  };

  const handleGenerateArticle = async () => {
    if (!articleTopic.trim()) {
      setError('Please enter an article topic');
      return;
    }

    const keys = getAPIKeys();
    if (!keys.openai) {
      setError('Please configure your OpenAI API key in Settings first');
      return;
    }

    setGenerating(true);
    setError(null);
    
    try {
      const article = await generateArticle(articleTopic, articleKeywords, wordCount, tone);
      setGeneratedArticle(article);
    } catch (err: any) {
      setError(err.message || 'Failed to generate article');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      setError('Please enter a video topic');
      return;
    }

    const keys = getAPIKeys();
    if (!keys.openai) {
      setError('Please configure your OpenAI API key in Settings first');
      return;
    }

    setGenerating(true);
    setError(null);
    
    try {
      const script = await generateVideoScript(videoPrompt, videoDuration);
      setGeneratedVideoScript(script);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video script');
    } finally {
      setGenerating(false);
    }
  };

  const tabs = [
    { id: 'article' as ContentType, label: 'AI Article', icon: FileText, color: 'purple' },
    { id: 'image' as ContentType, label: 'AI Image', icon: Image, color: 'pink' },
    { id: 'video' as ContentType, label: 'AI Video', icon: Video, color: 'red' },
  ];

  const recentContent = [
    {
      type: 'article',
      title: 'Complete Guide to Vehicle History Check in India',
      date: '2 hours ago',
      status: 'Published',
    },
    {
      type: 'image',
      title: 'Used Car Inspection Infographic',
      date: '5 hours ago',
      status: 'Draft',
    },
    {
      type: 'video',
      title: 'Step-by-Step Car Inspection Tutorial',
      date: '1 day ago',
      status: 'Published',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Content Manager</h1>
          <p className="text-slate-600">Create images, videos, and articles with AI</p>
        </div>
        
        {/* API Status Indicator */}
        <APIStatusIndicator />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">42</p>
              <p className="text-sm text-slate-600">Articles Created</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">127</p>
              <p className="text-sm text-slate-600">Images Generated</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">15</p>
              <p className="text-sm text-slate-600">Videos Produced</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Creation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8">
          {/* Article Creator */}
          {activeTab === 'article' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Generate AI Article</h3>
                <p className="text-slate-600 mb-6">Create SEO-optimized blog posts automatically</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Article Topic</label>
                  <input
                    type="text"
                    value={articleTopic}
                    onChange={(e) => setArticleTopic(e.target.value)}
                    placeholder="e.g., How to check vehicle history before buying"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target Keywords</label>
                    <input
                      type="text"
                      value={articleKeywords}
                      onChange={(e) => setArticleKeywords(e.target.value)}
                      placeholder="vehicle history, RTO verification"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Word Count</label>
                    <select
                      value={wordCount}
                      onChange={(e) => setWordCount(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option>500-800 words</option>
                      <option>800-1200 words</option>
                      <option>1200-1500 words</option>
                      <option>1500+ words</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tone</label>
                  <div className="flex gap-3">
                    {['Professional', 'Casual', 'Technical', 'Friendly'].map((toneOption) => (
                      <button
                        key={toneOption}
                        className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                          tone === toneOption
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}
                        onClick={() => setTone(toneOption)}
                      >
                        {toneOption}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateArticle}
                  disabled={generating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Article
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-6">
                <h4 className="font-bold text-slate-900 mb-3">Generated Content Preview</h4>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  {generatedArticle ? (
                    <p className="text-slate-600">{generatedArticle}</p>
                  ) : (
                    <p className="text-slate-600 italic">Generated article will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Creator */}
          {activeTab === 'image' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Generate AI Image</h3>
                <p className="text-slate-600 mb-6">Create custom images for your content</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Image Description</label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => {
                      setImagePrompt(e.target.value);
                      detectImageTypeAndSizes(e.target.value);
                    }}
                    placeholder="e.g., Modern car inspection with mechanic checking engine, professional photography style"
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Smart Detection Indicator */}
                {detectedImageType && imagePrompt && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900">Smart Detection: {detectedImageType}</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Optimized sizes suggested: {suggestedSizes.map((size, idx) => (
                          <span key={size}>
                            <strong>{size.replace('x', ' × ')}</strong>
                            {idx < suggestedSizes.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Style</label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>Photorealistic</option>
                      <option>Illustration</option>
                      <option>3D Render</option>
                      <option>Abstract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Size</label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {suggestedSizes.map(size => (
                        <option key={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Quality</label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>Standard</option>
                      <option>HD</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={generating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Image
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-6">
                <h4 className="font-bold text-slate-900 mb-3">Generated Image Preview</h4>
                <div className="bg-slate-200 rounded-lg aspect-video flex items-center justify-center">
                  {generatedImage ? (
                    <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-slate-500 italic">Generated image will appear here...</p>
                  )}
                </div>
              </div>

              {/* Edit Image */}
              {generatedImage && (
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                      <Edit className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Modify Image</h4>
                      <p className="text-sm text-slate-600">Provide suggestions to refine the generated image</p>
                    </div>
                  </div>

                  {/* Quick Suggestions */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Quick Suggestions</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Make it more colorful',
                        'Add more details',
                        'Make it minimalist',
                        'Change lighting to dramatic',
                        'Add background blur',
                        'Make it corporate style',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setEditSuggestion(suggestion)}
                          className="px-3 py-1.5 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 transition-colors text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Modification */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Modification</label>
                    <textarea
                      value={editSuggestion}
                      onChange={(e) => setEditSuggestion(e.target.value)}
                      placeholder="e.g., Make the background darker, add a professional business setting, change color scheme to blue tones"
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleModifyImage}
                      disabled={generating || !editSuggestion.trim()}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Modifying...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Apply Modification
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleUndoImage}
                      disabled={imageHistory.length <= 1}
                      className="px-6 py-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Undo
                    </button>
                  </div>

                  {/* Version History */}
                  {imageHistory.length > 1 && (
                    <div className="pt-4 border-t border-pink-200">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Version History ({imageHistory.length} versions)
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {imageHistory.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGeneratedImage(imgUrl)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              imgUrl === generatedImage ? 'border-pink-600' : 'border-slate-200'
                            }`}
                          >
                            <img src={imgUrl} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video Creator */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Generate AI Video</h3>
                <p className="text-slate-600 mb-6">Create video content with AI voiceover and visuals</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Video Topic</label>
                  <input
                    type="text"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g., Complete guide to used car inspection"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Video Script</label>
                  <textarea
                    placeholder="AI will generate script automatically or paste your own..."
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Voice Type</label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>Male - Professional</option>
                      <option>Female - Professional</option>
                      <option>Male - Casual</option>
                      <option>Female - Casual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
                    <select
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option>30 seconds</option>
                      <option>60 seconds</option>
                      <option>2-3 minutes</option>
                      <option>5+ minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Format</label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>YouTube (16:9)</option>
                      <option>Instagram Reel (9:16)</option>
                      <option>Square (1:1)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateVideo}
                  disabled={generating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-lg hover:from-red-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Generate Video
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-6">
                <h4 className="font-bold text-slate-900 mb-3">Video Preview</h4>
                <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center">
                  {generatedVideoScript ? (
                    <p className="text-slate-400">{generatedVideoScript}</p>
                  ) : (
                    <p className="text-slate-400 italic">Generated video will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Content */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-lg">Recently Generated Content</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {recentContent.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.type === 'article' ? 'bg-purple-100 text-purple-600' :
                    item.type === 'image' ? 'bg-pink-100 text-pink-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {item.type === 'article' ? <FileText className="w-5 h-5" /> :
                     item.type === 'image' ? <Image className="w-5 h-5" /> :
                     <Video className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.status}
                  </span>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}