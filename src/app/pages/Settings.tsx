import { useState, useEffect } from 'react';
import { Key, Facebook, Instagram, Linkedin, Youtube, Twitter, Save, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, Plus, Trash2, RefreshCw, Loader2, Bug } from 'lucide-react';
import { getAPIKeys, saveAPIKeys, loadAPIKeys } from '../utils/apiService';
import { fetchFacebookPages, validateFacebookToken, getConnectedFacebookPages, connectFacebookPage, disconnectFacebookPage, loadFacebookPages, saveConnectedFacebookPages, refreshConnectedPageTokens, type ConnectedFacebookPage } from '../utils/facebookService';
import {
  fetchInstagramAccounts,
  loadConnectedInstagram,
  connectInstagramAccount,
  disconnectInstagramAccount,
  type DiscoveredInstagramAccount,
} from '../utils/instagramService';
import {
  fetchLinkedInAccounts,
  loadConnectedLinkedIn,
  connectLinkedInAccount,
  disconnectLinkedInAccount,
  type DiscoveredLinkedInAccount,
} from '../utils/linkedinService';
import {
  fetchTwitterAccount,
  loadConnectedTwitter,
  connectTwitterAccount,
  disconnectTwitterAccount,
  type DiscoveredTwitterAccount,
} from '../utils/twitterService';
import type { ConnectedAccount } from '../utils/socialConnections';
import { Link } from 'react-router';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'api' | 'social'>('api');
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [saved, setSaved] = useState(false);
  const [loadingFacebookPages, setLoadingFacebookPages] = useState(false);
  const [facebookPagesAvailable, setFacebookPagesAvailable] = useState<any[]>([]);
  const [connectedFacebookPages, setConnectedFacebookPages] = useState<ConnectedFacebookPage[]>([]);

  // Instagram
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [instagramAvailable, setInstagramAvailable] = useState<DiscoveredInstagramAccount[]>([]);
  const [connectedInstagram, setConnectedInstagram] = useState<ConnectedAccount[]>([]);

  // LinkedIn
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);
  const [linkedInAvailable, setLinkedInAvailable] = useState<DiscoveredLinkedInAccount[]>([]);
  const [connectedLinkedIn, setConnectedLinkedIn] = useState<ConnectedAccount[]>([]);

  // Twitter
  const [loadingTwitter, setLoadingTwitter] = useState(false);
  const [twitterAvailable, setTwitterAvailable] = useState<DiscoveredTwitterAccount[]>([]);
  const [connectedTwitter, setConnectedTwitter] = useState<ConnectedAccount[]>([]);

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

      const [ig, li, tw] = await Promise.all([
        loadConnectedInstagram(),
        loadConnectedLinkedIn(),
        loadConnectedTwitter(),
      ]);
      setConnectedInstagram(ig);
      setConnectedLinkedIn(li);
      setConnectedTwitter(tw);

      if (savedKeys.openai && savedKeys.gemini && savedKeys.facebookAccessToken) {
        console.log('✅ Default API keys are loaded and ready to use!');
      }
    };

    loadData();
  }, []);

  // ---------- Instagram handlers ----------
  const handleFetchInstagram = async () => {
    if (!apiKeys.facebookAccessToken?.trim()) {
      alert('⚠️ Instagram Business needs your Facebook Access Token. Add it in API Keys first.');
      setActiveTab('api');
      return;
    }
    setLoadingInstagram(true);
    try {
      const accounts = await fetchInstagramAccounts(apiKeys.facebookAccessToken);
      setInstagramAvailable(accounts);
      alert(`✅ Found ${accounts.length} Instagram account(s). Select the ones to connect.`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setLoadingInstagram(false);
    }
  };
  const handleConnectInstagram = async (acc: DiscoveredInstagramAccount) => {
    try {
      const updated = await connectInstagramAccount(acc);
      setConnectedInstagram(updated);
      setInstagramAvailable(instagramAvailable.filter((a) => a.igUserId !== acc.igUserId));
      alert(`✅ Connected @${acc.username}`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };
  const handleDisconnectInstagram = async (id: string) => {
    const a = connectedInstagram.find((x) => x.id === id);
    if (!a || !window.confirm(`Disconnect "${a.name}"?`)) return;
    try {
      const updated = await disconnectInstagramAccount(id);
      setConnectedInstagram(updated);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  // ---------- LinkedIn handlers ----------
  const handleFetchLinkedIn = async () => {
    if (!apiKeys.linkedinAccessToken?.trim()) {
      alert('⚠️ Please enter your LinkedIn Access Token in API Keys first.');
      setActiveTab('api');
      return;
    }
    setLoadingLinkedIn(true);
    try {
      const accounts = await fetchLinkedInAccounts(apiKeys.linkedinAccessToken);
      setLinkedInAvailable(accounts);
      alert(`✅ Found ${accounts.length} LinkedIn account(s). Select which to connect.`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setLoadingLinkedIn(false);
    }
  };
  const handleConnectLinkedIn = async (acc: DiscoveredLinkedInAccount) => {
    try {
      const updated = await connectLinkedInAccount(acc);
      setConnectedLinkedIn(updated);
      setLinkedInAvailable(linkedInAvailable.filter((a) => a.urn !== acc.urn));
      alert(`✅ Connected "${acc.name}"`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };
  const handleDisconnectLinkedIn = async (urn: string) => {
    const a = connectedLinkedIn.find((x) => x.id === urn);
    if (!a || !window.confirm(`Disconnect "${a.name}"?`)) return;
    try {
      const updated = await disconnectLinkedInAccount(urn);
      setConnectedLinkedIn(updated);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  // ---------- Twitter handlers ----------
  const handleFetchTwitter = async () => {
    if (!apiKeys.twitterAccessToken?.trim()) {
      alert('⚠️ Please enter your Twitter/X Access Token in API Keys first.');
      setActiveTab('api');
      return;
    }
    setLoadingTwitter(true);
    try {
      const accounts = await fetchTwitterAccount(apiKeys.twitterAccessToken);
      setTwitterAvailable(accounts);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setLoadingTwitter(false);
    }
  };
  const handleConnectTwitter = async (acc: DiscoveredTwitterAccount) => {
    try {
      const updated = await connectTwitterAccount(acc);
      setConnectedTwitter(updated);
      setTwitterAvailable(twitterAvailable.filter((a) => a.id !== acc.id));
      alert(`✅ Connected @${acc.username}`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };
  const handleDisconnectTwitter = async (id: string) => {
    const a = connectedTwitter.find((x) => x.id === id);
    if (!a || !window.confirm(`Disconnect "${a.name}"?`)) return;
    try {
      const updated = await disconnectTwitterAccount(id);
      setConnectedTwitter(updated);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

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

      // Filter "available to connect" to those NOT already connected; for the
      // already-connected ones, refresh their stored access tokens silently.
      const connectedIds = new Set(connectedFacebookPages.map((p) => p.pageId));
      const fresh = pages.filter((p) => !connectedIds.has(p.id));
      setFacebookPagesAvailable(fresh);

      let refreshedCount = 0;
      if (connectedIds.size > 0) {
        try {
          const result = await refreshConnectedPageTokens(apiKeys.facebookAccessToken);
          refreshedCount = result.refreshed;
          if (refreshedCount > 0) setConnectedFacebookPages(result.pages);
        } catch (refreshErr) {
          console.warn('Token refresh failed:', refreshErr);
        }
      }

      const lines: string[] = [];
      if (refreshedCount > 0) lines.push(`🔄 Refreshed ${refreshedCount} existing page token(s).`);
      if (fresh.length > 0)
        lines.push(`✅ Found ${fresh.length} new page(s). Select which to connect.`);
      else if (refreshedCount === 0 && pages.length === 0)
        lines.push('⚠️ No Facebook pages found. Make sure you manage at least one Facebook page.');
      else if (fresh.length === 0)
        lines.push('All your pages are already connected — tokens refreshed.');

      alert(lines.join('\n'));
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
      const updated = await connectFacebookPage(page);
      setConnectedFacebookPages(updated);
      alert(`✅ Connected to "${page.name}" successfully!`);
      // Remove from available list
      setFacebookPagesAvailable(facebookPagesAvailable.filter((p) => p.id !== page.id));
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  // Disconnect a Facebook page
  const handleDisconnectFacebookPage = async (pageId: string) => {
    const page = connectedFacebookPages.find((p) => p.pageId === pageId);
    if (!page) return;
    if (!window.confirm(`Are you sure you want to disconnect "${page.pageName}"?`)) return;
    try {
      const updated = await disconnectFacebookPage(pageId);
      setConnectedFacebookPages(updated);
      alert(`✅ Disconnected from "${page.pageName}" successfully!`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
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

            {/* Instagram */}
            <PlatformSection
              icon={<Instagram className="w-7 h-7 text-pink-600" />}
              title="Instagram Accounts"
              subtitle="Connect Instagram Business/Creator accounts linked to your Facebook Pages"
              accentBg="bg-pink-600"
              loading={loadingInstagram}
              onFetch={handleFetchInstagram}
              connected={connectedInstagram}
              available={instagramAvailable.map((a) => ({
                id: a.igUserId,
                name: a.name,
                handle: '@' + a.username,
                avatar: a.profilePicture,
                extra: a,
              }))}
              onConnect={(opt) => handleConnectInstagram(opt.extra)}
              onDisconnect={handleDisconnectInstagram}
              helpLines={[
                'Enter your Facebook Access Token in API Keys (Instagram rides on the same token)',
                'Your Instagram must be a Business/Creator account linked to a Facebook Page',
                'Required scopes: instagram_basic, pages_show_list, pages_read_engagement',
              ]}
            />

            {/* LinkedIn */}
            <PlatformSection
              icon={<Linkedin className="w-7 h-7 text-blue-700" />}
              title="LinkedIn Accounts"
              subtitle="Connect your personal profile and organizations you administer"
              accentBg="bg-blue-700"
              loading={loadingLinkedIn}
              onFetch={handleFetchLinkedIn}
              connected={connectedLinkedIn}
              available={linkedInAvailable.map((a) => ({
                id: a.urn,
                name: a.name,
                handle: a.kind === 'organization' ? 'Organization' : 'Personal',
                avatar: a.avatar,
                extra: a,
              }))}
              onConnect={(opt) => handleConnectLinkedIn(opt.extra)}
              onDisconnect={handleDisconnectLinkedIn}
              helpLines={[
                'Save your LinkedIn Access Token in API Keys first',
                'OAuth 2.0 token needs scopes: openid, profile, email',
                'For organization pages also add: rw_organization_admin, w_organization_social',
              ]}
            />

            {/* Twitter / X */}
            <PlatformSection
              icon={<Twitter className="w-7 h-7 text-sky-500" />}
              title="Twitter/X Accounts"
              subtitle="Connect your X account via an OAuth 2.0 user-context token"
              accentBg="bg-sky-500"
              loading={loadingTwitter}
              onFetch={handleFetchTwitter}
              connected={connectedTwitter}
              available={twitterAvailable.map((a) => ({
                id: a.id,
                name: a.name,
                handle: '@' + a.username,
                avatar: a.avatar,
                extra: a,
              }))}
              onConnect={(opt) => handleConnectTwitter(opt.extra)}
              onDisconnect={handleDisconnectTwitter}
              helpLines={[
                'Save your Twitter/X Access Token in API Keys first',
                'Must be a USER-CONTEXT OAuth 2.0 token, not an App-only Bearer token',
                'Required scopes: tweet.read, users.read (add tweet.write to post later)',
              ]}
            />

            {/* YouTube (Coming Soon — requires YouTube Partner Program) */}
            <div className="bg-white rounded-xl shadow-sm p-6 opacity-60">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-7 h-7 text-red-600" />
                <h2 className="text-2xl font-bold text-slate-900">YouTube Channels</h2>
              </div>
              <p className="text-slate-600">
                YouTube Community Posts require YouTube Partner Program membership, so the Community
                Post API is gated. Channel video uploads need a separate OAuth flow — coming later.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlatformSection: generic "Fetch → pick → connect → persist" card used for
// Instagram, LinkedIn, and Twitter/X. Mirrors the Facebook section's UX.
// ---------------------------------------------------------------------------
type PlatformOption = {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
  extra?: any;
};

type PlatformSectionProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentBg: string;
  loading: boolean;
  onFetch: () => void | Promise<void>;
  connected: ConnectedAccount[];
  available: PlatformOption[];
  onConnect: (opt: PlatformOption) => void | Promise<void>;
  onDisconnect: (id: string) => void | Promise<void>;
  helpLines: string[];
};

function PlatformSection({
  icon,
  title,
  subtitle,
  accentBg,
  loading,
  onFetch,
  connected,
  available,
  onConnect,
  onDisconnect,
  helpLines,
}: PlatformSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <p className="text-slate-600 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={onFetch}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Fetch Accounts
            </>
          )}
        </button>
      </div>

      {connected.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Connected ({connected.length})
          </h3>
          <div className="space-y-3">
            {connected.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {acc.avatar ? (
                    <img src={acc.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div
                      className={`w-10 h-10 ${accentBg} rounded-full flex items-center justify-center text-white`}
                    >
                      {icon}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{acc.name}</p>
                    {acc.handle && <p className="text-xs text-slate-500">{acc.handle}</p>}
                    {acc.category && <p className="text-xs text-slate-500">{acc.category}</p>}
                  </div>
                </div>
                <button
                  onClick={() => onDisconnect(acc.id)}
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

      {available.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Available ({available.length})
          </h3>
          <div className="space-y-3">
            {available.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {opt.avatar ? (
                    <img src={opt.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div
                      className={`w-10 h-10 ${accentBg} rounded-full flex items-center justify-center text-white opacity-80`}
                    >
                      {icon}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{opt.name}</p>
                    {opt.handle && <p className="text-xs text-slate-500">{opt.handle}</p>}
                  </div>
                </div>
                <button
                  onClick={() => onConnect(opt)}
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

      {connected.length === 0 && available.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to connect:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            {helpLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            <li>
              Come back here and click <strong>"Fetch Accounts"</strong>
            </li>
            <li>Select which accounts to connect — they persist across sessions</li>
          </ol>
        </div>
      )}
    </div>
  );
}