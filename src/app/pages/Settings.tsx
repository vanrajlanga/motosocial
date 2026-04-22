import { useState, useEffect } from 'react';
import { Key, Facebook, Instagram, Linkedin, Youtube, Twitter, Save, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, Plus, Trash2, RefreshCw, Loader2, Bug } from 'lucide-react';
import { getAPIKeys, saveAPIKeys, loadAPIKeys } from '../utils/apiService';
import { fetchFacebookPages, validateFacebookToken, getConnectedFacebookPages, connectFacebookPage, disconnectFacebookPage, loadFacebookPages, saveConnectedFacebookPages, type ConnectedFacebookPage } from '../utils/facebookService';
import { Link } from 'react-router';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'api' | 'social'>('api');
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [saved, setSaved] = useState(false);
  const [loadingFacebookPages, setLoadingFacebookPages] = useState(false);
  const [facebookPagesAvailable, setFacebookPagesAvailable] = useState<any[]>([]);
  const [connectedFacebookPages, setConnectedFacebookPages] = useState<ConnectedFacebookPage[]>([]);

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: '',
    elevenlabs: '',
    dalle: '',
    stabilityai: '',
    googleCloud: '',
    imgurClientId: '',
    imgbbApiKey: '',
    facebookAccessToken: '',
    instagramAccessToken: '',
    linkedinAccessToken: '',
    youtubeAccessToken: '',
    twitterAccessToken: '',
  });

  // Load API keys and connected pages on mount
  useEffect(() => {
    const loadData = async () => {
      const savedKeys = await loadAPIKeys();
      setApiKeys(savedKeys);
      
      const connected = await loadFacebookPages();
      setConnectedFacebookPages(connected);
      
      // Show notification that default keys are available
      if (savedKeys.openai && savedKeys.gemini && savedKeys.facebookAccessToken) {
        console.log('✅ Default API keys are loaded and ready to use!');
      }
    };
    
    loadData();
  }, []);

  const toggleShowKey = (key: string) => {
    setShowKeys({ ...showKeys, [key]: !showKeys[key] });
  };

  const handleSaveAPI = async () => {
    const success = await saveAPIKeys(apiKeys);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Fetch Facebook Pages using the access token
  const handleFetchFacebookPages = async () => {
    if (!apiKeys.facebookAccessToken || apiKeys.facebookAccessToken.trim().length === 0) {
      alert('⚠️ Please enter your Facebook Access Token in the API Keys section first.');
      setActiveTab('api');
      return;
    }

    setLoadingFacebookPages(true);
    try {
      // Validate token first
      const userInfo = await validateFacebookToken(apiKeys.facebookAccessToken);
      console.log('Facebook user validated:', userInfo);

      // Fetch pages
      const pages = await fetchFacebookPages(apiKeys.facebookAccessToken);
      setFacebookPagesAvailable(pages);
      
      if (pages.length === 0) {
        alert('⚠️ No Facebook pages found. Make sure you manage at least one Facebook page.');
      } else {
        alert(`✅ Found ${pages.length} Facebook page(s)! Select the ones you want to connect.`);
      }
    } catch (error: any) {
      console.error('Error fetching Facebook pages:', error);
      alert(`❌ Error: ${error.message}\n\nMake sure your access token has the 'pages_show_list' permission.`);
    } finally {
      setLoadingFacebookPages(false);
    }
  };

  // Connect a Facebook page
  const handleConnectFacebookPage = async (page: any) => {
    try {
      connectFacebookPage(page);
      const updated = await loadFacebookPages();
      setConnectedFacebookPages(updated);
      alert(`✅ Connected to "${page.name}" successfully!`);
      
      // Remove from available list
      setFacebookPagesAvailable(facebookPagesAvailable.filter(p => p.id !== page.id));
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  // Disconnect a Facebook page
  const handleDisconnectFacebookPage = async (pageId: string) => {
    const page = connectedFacebookPages.find(p => p.pageId === pageId);
    if (page && window.confirm(`Are you sure you want to disconnect "${page.pageName}"?`)) {
      disconnectFacebookPage(pageId);
      const updated = await loadFacebookPages();
      setConnectedFacebookPages(updated);
      alert(`✅ Disconnected from "${page.pageName}" successfully!`);
    }
  };

  const apiKeyFields = [
    {
      label: 'OpenAI API Key',
      key: 'openai',
      placeholder: 'sk-...',
      description: 'For AI Content Manager - Generate articles and scripts',
    },
    {
      label: 'Google Gemini API Key',
      key: 'gemini',
      placeholder: 'AIza...',
      description: 'Alternative AI provider for content generation',
    },
    {
      label: 'ElevenLabs API Key',
      key: 'elevenlabs',
      placeholder: 'el_...',
      description: 'For voice synthesis and audio content',
    },
    {
      label: 'DALL-E API Key',
      key: 'dalle',
      placeholder: 'sk-...',
      description: 'For AI image generation (uses OpenAI)',
    },
    {
      label: 'Stability AI API Key',
      key: 'stabilityai',
      placeholder: 'sk-...',
      description: 'Alternative image generation provider',
    },
    {
      label: 'Google Cloud API Key',
      key: 'googleCloud',
      placeholder: 'AIza...',
      description: 'For YouTube and other Google services',
    },
    {
      label: 'Imgur Client ID',
      key: 'imgurClientId',
      placeholder: 'abc123def456...',
      description: 'OPTIONAL - Image hosting (we use free Catbox.moe & ImgBB by default, no API key needed!)',
    },
    {
      label: 'ImgBB API Key',
      key: 'imgbbApiKey',
      placeholder: 'abc123def456...',
      description: 'OPTIONAL - Get free key from https://api.imgbb.com/ (we provide a default key)',
    },
  ];

  const socialMediaTokenFields = [
    {
      label: 'Facebook Access Token',
      key: 'facebookAccessToken',
      placeholder: 'EAAUx...',
      description: 'Get from Facebook Graph API Explorer with pages_show_list, pages_read_engagement, pages_manage_posts permissions',
      link: 'https://developers.facebook.com/tools/explorer/',
    },
    {
      label: 'Instagram Access Token',
      key: 'instagramAccessToken',
      placeholder: 'IGQVJx...',
      description: 'Get from Facebook Graph API Explorer (Instagram Business Account)',
      link: 'https://developers.facebook.com/tools/explorer/',
    },
    {
      label: 'LinkedIn Access Token',
      key: 'linkedinAccessToken',
      placeholder: 'AQV...',
      description: 'Get from LinkedIn OAuth 2.0',
      link: 'https://www.linkedin.com/developers/apps',
    },
    {
      label: 'YouTube Access Token',
      key: 'youtubeAccessToken',
      placeholder: 'ya29...',
      description: 'Get from Google Cloud Console',
      link: 'https://console.cloud.google.com/',
    },
    {
      label: 'Twitter/X Access Token',
      key: 'twitterAccessToken',
      placeholder: 'AAAAAAAAAAAAAAAAAAAAAxx...',
      description: 'Get from Twitter Developer Portal',
      link: 'https://developer.twitter.com/en/portal/dashboard',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your API keys and social media connections</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'api'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </div>
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'social'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Facebook className="w-5 h-5" />
              Social Media
            </div>
          </button>
        </div>

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* AI Services */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">AI Services API Keys</h2>
              <p className="text-slate-600 mb-6">Configure API keys for AI-powered content generation</p>
              
              <div className="space-y-4">
                {apiKeyFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {field.label}
                    </label>
                    <p className="text-xs text-slate-500 mb-2">{field.description}</p>
                    <div className="relative">
                      <input
                        type={showKeys[field.key] ? 'text' : 'password'}
                        value={apiKeys[field.key as keyof typeof apiKeys]}
                        onChange={(e) => setApiKeys({ ...apiKeys, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => toggleShowKey(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showKeys[field.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Access Tokens */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Social Media Access Tokens</h2>
              <p className="text-slate-600 mb-6">Store your social media API tokens to enable posting</p>
              
              {/* Facebook Token Active Notice */}
              {apiKeys.facebookAccessToken && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">✅ Default Facebook Token Active</p>
                    <p className="text-xs text-green-700 mt-1">
                      Your Facebook access token is loaded and ready to use. Click "Load Facebook Pages" in the Social Media Connections tab to connect your pages.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {socialMediaTokenFields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        {field.label}
                      </label>
                      <a
                        href={field.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Get Token
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{field.description}</p>
                    <div className="relative">
                      <input
                        type={showKeys[field.key] ? 'text' : 'password'}
                        value={apiKeys[field.key as keyof typeof apiKeys]}
                        onChange={(e) => setApiKeys({ ...apiKeys, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                      />
                      <button
                        onClick={() => toggleShowKey(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showKeys[field.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-between items-center">
              <Link 
                to="/system-status"
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all flex items-center gap-2 font-semibold"
              >
                <Bug className="w-5 h-5" />
                Debug System
              </Link>
              
              <button
                onClick={handleSaveAPI}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 font-semibold shadow-lg"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save API Keys
                  </>
                )}
              </button>
            </div>

            {/* Help Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> All API keys are saved to the cloud database. 
                Open your browser console (F12) to see detailed save/load logs. 
                If saving fails, click "Debug System" to check your connection status.
              </p>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* Facebook Pages */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Facebook className="w-7 h-7 text-blue-600" />
                    Facebook Pages
                  </h2>
                  <p className="text-slate-600 mt-1">Connect one or more Facebook pages to publish posts</p>
                </div>
                <button
                  onClick={handleFetchFacebookPages}
                  disabled={loadingFacebookPages}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingFacebookPages ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Fetch My Pages
                    </>
                  )}
                </button>
              </div>

              {/* Connected Pages */}
              {connectedFacebookPages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Connected Pages ({connectedFacebookPages.length})</h3>
                  <div className="space-y-3">
                    {connectedFacebookPages.map((page) => (
                      <div key={page.pageId} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <Facebook className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{page.pageName}</p>
                            <p className="text-xs text-slate-500">ID: {page.pageId}</p>
                            {page.category && (
                              <p className="text-xs text-slate-500">Category: {page.category}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDisconnectFacebookPage(page.pageId)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Pages to Connect */}
              {facebookPagesAvailable.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Available Pages ({facebookPagesAvailable.length})</h3>
                  <div className="space-y-3">
                    {facebookPagesAvailable.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
                            <Facebook className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{page.name}</p>
                            <p className="text-xs text-slate-500">ID: {page.id}</p>
                            {page.category && (
                              <p className="text-xs text-slate-500">Category: {page.category}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleConnectFacebookPage(page)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {connectedFacebookPages.length === 0 && facebookPagesAvailable.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">How to Connect Facebook Pages:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Go to <strong>API Keys</strong> tab above</li>
                    <li>Add your <strong>Facebook Access Token</strong></li>
                    <li>Save the API Keys</li>
                    <li>Come back here and click <strong>"Fetch My Pages"</strong></li>
                    <li>Select which pages you want to connect</li>
                  </ol>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Required Permissions:</strong> pages_show_list, pages_read_engagement, pages_manage_posts
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Instagram (Coming Soon) */}
            <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
              <div className="flex items-center gap-2 mb-4">
                <Instagram className="w-7 h-7 text-pink-600" />
                <h2 className="text-2xl font-bold text-slate-900">Instagram Accounts</h2>
              </div>
              <p className="text-slate-600">Instagram account management coming soon...</p>
            </div>

            {/* LinkedIn (Coming Soon) */}
            <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
              <div className="flex items-center gap-2 mb-4">
                <Linkedin className="w-7 h-7 text-blue-700" />
                <h2 className="text-2xl font-bold text-slate-900">LinkedIn Pages</h2>
              </div>
              <p className="text-slate-600">LinkedIn page management coming soon...</p>
            </div>

            {/* Twitter (Coming Soon) */}
            <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
              <div className="flex items-center gap-2 mb-4">
                <Twitter className="w-7 h-7 text-sky-500" />
                <h2 className="text-2xl font-bold text-slate-900">Twitter/X Accounts</h2>
              </div>
              <p className="text-slate-600">Twitter account management coming soon...</p>
            </div>

            {/* YouTube (Coming Soon) */}
            <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-7 h-7 text-red-600" />
                <h2 className="text-2xl font-bold text-slate-900">YouTube Channels</h2>
              </div>
              <p className="text-slate-600">YouTube channel management coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}