import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles, Hash, Calendar, Send, Plus, Heart, MessageCircle, Share2, ThumbsUp, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';
import { publishToSocialMedia, validatePostData, savePostToHistory } from '../utils/socialMediaPublisher';
import { getConnectedFacebookPages } from '../utils/facebookService';
import { uploadImageToPublicHost, fileToDataURL, isValidHttpUrl } from '../utils/imageUploader';
import { generateHashtags } from '../utils/hashtagGenerator';
import { generateContent } from '../utils/contentGenerator';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'twitter';
  name: string;
  username: string;
  connected: boolean;
  icon: any;
  color: string;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [campaign, setCampaign] = useState('');
  const [tags, setTags] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [captionSize, setCaptionSize] = useState<'HE' | 'GNP' | 'GIP'>('GNP');

  // Load connected social accounts from localStorage
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

  useEffect(() => {
    if (isOpen) {
      const accounts: SocialAccount[] = [];

      // Load Facebook pages from new structure
      const facebookPages = getConnectedFacebookPages();
      facebookPages.forEach((page) => {
        accounts.push({
          id: 'facebook-' + page.pageId,
          platform: 'facebook',
          name: page.pageName,
          username: page.pageName,
          connected: true,
          icon: Facebook,
          color: 'bg-blue-600',
        });
      });

      // Load other platforms from old structure for now
      const savedConnections = localStorage.getItem('motopsy_social_connections');
      if (savedConnections) {
        const connections = JSON.parse(savedConnections);

        // Instagram
        if (connections.instagram?.connected) {
          accounts.push({
            id: 'instagram-' + connections.instagram.username,
            platform: 'instagram',
            name: connections.instagram.username || 'Instagram Account',
            username: connections.instagram.username || '@myaccount',
            connected: true,
            icon: Instagram,
            color: 'bg-pink-600',
          });
        }

        // LinkedIn
        if (connections.linkedin?.connected) {
          accounts.push({
            id: 'linkedin-' + connections.linkedin.pageName,
            platform: 'linkedin',
            name: connections.linkedin.pageName || 'LinkedIn Page',
            username: connections.linkedin.pageName || 'My Company',
            connected: true,
            icon: Linkedin,
            color: 'bg-blue-700',
          });
        }

        // YouTube
        if (connections.youtube?.connected) {
          accounts.push({
            id: 'youtube-' + connections.youtube.channelId,
            platform: 'youtube',
            name: connections.youtube.channelName || 'YouTube Channel',
            username: connections.youtube.channelName || 'My Channel',
            connected: true,
            icon: Youtube,
            color: 'bg-red-600',
          });
        }

        // Twitter
        if (connections.twitter?.connected) {
          accounts.push({
            id: 'twitter-' + connections.twitter.username,
            platform: 'twitter',
            name: connections.twitter.username || 'Twitter Account',
            username: connections.twitter.username || '@myaccount',
            connected: true,
            icon: Twitter,
            color: 'bg-sky-500',
          });
        }
      }

      setSocialAccounts(accounts);
    }
  }, [isOpen]);

  const toggleAccount = (accountId: string) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    } else {
      setSelectedAccounts([...selectedAccounts, accountId]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage: UploadedImage = {
            id: Date.now().toString() + Math.random(),
            file: file,
            preview: reader.result as string,
          };
          setUploadedImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input to allow re-uploading the same file
    e.target.value = '';
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleEnhanceWithAI = () => {
    // Simulate AI enhancement
    const enhancements = [
      'Add emojis: ' + caption + ' 🚗✨💯',
      'Make it engaging: "Exciting news! ' + caption + ' Don\'t miss out!"',
      'Add hashtags: ' + caption + ' #Motopsy #VehicleInspection #CarCare',
    ];
    const enhanced = enhancements[Math.floor(Math.random() * enhancements.length)];
    setCaption(enhanced);
  };

  const handleGenerateHashtags = async () => {
    if (!caption || caption.trim().length === 0) {
      alert('⚠️ Please write your caption first before generating hashtags.');
      return;
    }

    setIsGeneratingHashtags(true);
    try {
      const hashtags = await generateHashtags(caption, 10);
      
      // Add hashtags to the end of caption if not already there
      if (!caption.includes('#')) {
        setCaption(caption + '\n\n' + hashtags.join(' '));
      } else {
        // Replace existing hashtags
        const captionWithoutHashtags = caption.replace(/#\w+/g, '').trim();
        setCaption(captionWithoutHashtags + '\n\n' + hashtags.join(' '));
      }
      
      setIsGeneratingHashtags(false);
    } catch (error: any) {
      setIsGeneratingHashtags(false);
      alert(`Error generating hashtags: ${error.message}`);
    }
  };

  const handleGenerateContent = async () => {
    if (!keyword || keyword.trim().length === 0) {
      alert('⚠️ Please enter a keyword first before generating content.');
      return;
    }

    setIsGeneratingContent(true);
    try {
      const content = await generateContent(keyword, captionSize);
      
      // Add content to the caption
      setCaption(content);
      
      setIsGeneratingContent(false);
    } catch (error: any) {
      setIsGeneratingContent(false);
      alert(`Error generating content: ${error.message}`);
    }
  };

  const handleGenerateImage = async () => {
    if (!caption || caption.trim().length === 0) {
      alert('⚠️ Please write your caption first before generating an image.');
      return;
    }

    setIsGeneratingImage(true);
    try {
      console.log('🎨 Generating image from caption...');
      
      // Extract keywords from caption for search
      const keywords = caption
        .replace(/#\w+/g, '') // Remove hashtags
        .replace(/[^\w\s]/g, ' ') // Remove special characters
        .split(/\s+/)
        .filter(word => word.length > 3) // Only words longer than 3 chars
        .slice(0, 3) // Take first 3 keywords
        .join(' ');
      
      const searchQuery = keywords || 'business professional';
      console.log('🔍 Search keywords:', searchQuery);
      
      // Use server to get Unsplash image (bypasses CORS!)
      console.log('📥 Fetching image from server...');
      
      const { projectId, publicAnonKey } = await import('/utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-782899ec/generate-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: searchQuery,
            caption: caption 
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      console.log('✅ Image URL received:', data.imageUrl);
      
      // Create a dummy file (actual URL will be used for publishing)
      const dummyFile = new File([''], 'stock-image.jpg', { type: 'image/jpeg' });
      
      // Create UploadedImage with the permanent URL from server
      const newImage: UploadedImage = {
        id: Date.now().toString() + Math.random(),
        file: dummyFile,
        preview: data.imageUrl, // ✅ PERMANENT URL FROM SERVER!
      };
      
      setUploadedImages(prev => [...prev, newImage]);
      setIsGeneratingImage(false);
      
      alert('✅ SUCCESS! Image generated and ready to use!');
      
    } catch (error: any) {
      console.error('❌ ERROR during image generation:', error);
      setIsGeneratingImage(false);
      alert(`❌ Error: ${error.message || 'Failed to generate image'}\n\nPlease try again or upload an image manually.`);
    }
  };

  const handlePublish = async () => {
    // Prepare post data - automatic upload will happen in socialMediaPublisher
    const postData = {
      caption,
      imageUrl: uploadedImages.length > 0 ? uploadedImages[0].preview : undefined,
      imageFile: uploadedImages.length > 0 ? uploadedImages[0].file : undefined,
      platforms: selectedAccounts,
    };

    // Validate post data
    const validation = validatePostData(postData);
    if (!validation.valid) {
      alert(validation.error || 'Please check your post data');
      return;
    }

    // Show confirmation for Instagram if no image
    const hasInstagram = selectedAccounts.some(acc => acc.includes('instagram'));
    if (hasInstagram && !postData.imageFile) {
      const proceed = window.confirm('Instagram requires an image. The post will only be published to other selected platforms. Continue?');
      if (!proceed) return;
    }

    // Publish to social media (automatic upload happens inside)
    setIsPublishing(true);
    
    try {
      const results = await publishToSocialMedia(postData);
      setIsPublishing(false);

      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Build result message
      let message = ``;
      
      if (successCount > 0) {
        message += `✅ SUCCESS! Published to ${successCount} platform(s):\n\n`;
        results.filter(r => r.success).forEach(result => {
          message += `✓ ${result.platform}\n`;
          if (result.postUrl) {
            message += `  View: ${result.postUrl}\n`;
          }
        });
      }

      if (failureCount > 0) {
        message += `\n\n⚠️ FAILED on ${failureCount} platform(s):\n\n`;
        results.filter(r => !r.success).forEach(result => {
          message += `✗ ${result.platform}:\n  ${result.error}\n\n`;
        });
      }

      // Show results
      alert(message);

      // Save to history only if at least one succeeded
      if (successCount > 0) {
        savePostToHistory(postData, results);

        // Reset form only if all successful
        if (failureCount === 0) {
          setCaption('');
          setSelectedAccounts([]);
          setCampaign('');
          setTags('');
          setUploadedImages([]);
          onClose();
        }
      }
    } catch (error: any) {
      setIsPublishing(false);
      alert(`Error publishing post: ${error.message || 'Unknown error occurred'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-slate-900">Create a post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Content Generator */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              🤖 AI Content Generator
            </label>
            
            {/* Caption Size Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Select Caption Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setCaptionSize('HE')}
                  className={`px-3 py-2 rounded-lg border-2 transition-all ${
                    captionSize === 'HE'
                      ? 'border-purple-600 bg-purple-100 text-purple-700 font-bold'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-purple-400'
                  }`}
                >
                  <div className="text-sm font-bold">HE</div>
                  <div className="text-xs">Highest Engagement</div>
                  <div className="text-xs text-slate-500">150-200 chars</div>
                </button>
                <button
                  onClick={() => setCaptionSize('GNP')}
                  className={`px-3 py-2 rounded-lg border-2 transition-all ${
                    captionSize === 'GNP'
                      ? 'border-purple-600 bg-purple-100 text-purple-700 font-bold'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-purple-400'
                  }`}
                >
                  <div className="text-sm font-bold">GNP</div>
                  <div className="text-xs">Good for Normal Posts</div>
                  <div className="text-xs text-slate-500">300-350 chars</div>
                </button>
                <button
                  onClick={() => setCaptionSize('GIP')}
                  className={`px-3 py-2 rounded-lg border-2 transition-all ${
                    captionSize === 'GIP'
                      ? 'border-purple-600 bg-purple-100 text-purple-700 font-bold'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-purple-400'
                  }`}
                >
                  <div className="text-sm font-bold">GIP</div>
                  <div className="text-xs">Good for Informative</div>
                  <div className="text-xs text-slate-500">450+ chars</div>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter keyword or topic (e.g., 'vehicle inspection', 'car maintenance')..."
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleGenerateContent}
                disabled={isGeneratingContent || !keyword.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
              >
                {isGeneratingContent ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Post
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              💡 Tip: Select caption size above, enter a keyword, and click "Generate Post" to create AI-powered content instantly!
            </p>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption or use the AI generator above..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            
            {/* AI Enhancement Tools */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleEnhanceWithAI}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Enhance with AI
              </button>
              <button
                onClick={handleGenerateHashtags}
                disabled={isGeneratingHashtags}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingHashtags ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Hash className="w-4 h-4" />
                    Generate Hashtags
                  </>
                )}
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading to Cloud...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Generate Image
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Images (optional)
            </label>
            
            {/* Info Note */}
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>✨ Automatic Upload:</strong> Images are automatically uploaded to cloud storage (ImgBB) when you publish. No manual setup needed!
              </p>
            </div>
            
            {/* Upload Button */}
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
              <ImageIcon className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Upload Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt="Uploaded"
                      className="w-full h-40 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Publish To */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Publish to
            </label>
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-left flex items-center justify-between hover:border-purple-500 transition-colors"
              >
                <span className="text-slate-600">
                  {selectedAccounts.length > 0
                    ? `${selectedAccounts.length} account${selectedAccounts.length > 1 ? 's' : ''} selected`
                    : 'Select accounts'}
                </span>
                <Plus className="w-5 h-5 text-slate-400" />
              </button>

              {showAccountDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                  {socialAccounts.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      <p>No connected accounts</p>
                      <p className="text-sm mt-1">Connect accounts in Settings</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {socialAccounts.map((account) => {
                        const Icon = account.icon;
                        const isSelected = selectedAccounts.includes(account.id);
                        return (
                          <button
                            key={account.id}
                            onClick={() => toggleAccount(account.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div className={`${account.color} p-2 rounded-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-slate-900">{account.name}</p>
                              <p className="text-xs text-slate-500">{account.username}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-purple-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Accounts Preview */}
            {selectedAccounts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAccounts.map((accountId) => {
                  const account = socialAccounts.find(a => a.id === accountId);
                  if (!account) return null;
                  const Icon = account.icon;
                  return (
                    <div
                      key={accountId}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg"
                    >
                      <div className={`${account.color} p-1 rounded`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{account.name}</span>
                      <button
                        onClick={() => toggleAccount(accountId)}
                        className="ml-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Post Preview */}
          {caption && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Preview</h3>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Motopsy</p>
                    <p className="text-xs text-slate-500">Just now</p>
                  </div>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap mb-3">{caption}</p>
                {uploadedImages.length > 0 && (
                  <img
                    src={uploadedImages[0].preview}
                    alt="Preview"
                    className="w-full rounded-lg border border-slate-200"
                  />
                )}
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-200">
                  <button className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">Comment</span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || selectedAccounts.length === 0 || !caption.trim()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Publish Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}