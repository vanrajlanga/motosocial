import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Instagram, Linkedin, Twitter, Youtube, FileText } from 'lucide-react';

interface ScheduledPost {
  id: string;
  platform: string;
  type: string;
  title: string;
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'draft';
  keywords: string[];
}

interface CalendarViewProps {
  posts: ScheduledPost[];
}

// Convert a date-like input (ISO string OR plain YYYY-MM-DD) to a local-time
// YYYY-MM-DD key, matching how the calendar grid is laid out in the user's
// timezone.
const toLocalDateKey = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10); // fallback: assume YYYY-MM-DD already
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function CalendarView({ posts }: CalendarViewProps) {
  // Open the calendar on the month of the FIRST scheduled post, falling back
  // to "today" if there are no posts. This way the user immediately sees
  // their schedule instead of an empty placeholder month.
  const initialMonth = (() => {
    const first = posts
      .map((p) => new Date(p.scheduledDate))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const seed = first || new Date();
    return new Date(seed.getFullYear(), seed.getMonth(), 1);
  })();
  const [currentDate, setCurrentDate] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getPostsForDate = (day: number | null) => {
    if (!day) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter((post) => toLocalDateKey(post.scheduledDate) === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-3 h-3" />;
      case 'linkedin':
        return <Linkedin className="w-3 h-3" />;
      case 'twitter':
        return <Twitter className="w-3 h-3" />;
      case 'youtube':
        return <Youtube className="w-3 h-3" />;
      case 'blog':
        return <FileText className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-pink-500';
      case 'linkedin':
        return 'bg-blue-500';
      case 'twitter':
        return 'bg-sky-500';
      case 'youtube':
        return 'bg-red-500';
      case 'blog':
        return 'bg-purple-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'linkedin':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'twitter':
        return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'youtube':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'blog':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthName = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Content Calendar</h3>
                <p className="text-sm text-slate-600">View all scheduled posts by date</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <div className="text-center min-w-[180px]">
                  <div className="font-bold text-slate-900 text-lg">{monthName} {year}</div>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-semibold text-slate-600 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayPosts = getPostsForDate(day);
              const hasMultiplePosts = dayPosts.length > 1;
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] border rounded-lg p-2 ${
                    day ? 'bg-white hover:bg-slate-50 cursor-pointer' : 'bg-slate-50'
                  } ${
                    isToday(day) ? 'border-blue-500 border-2' : 'border-slate-200'
                  } transition-all`}
                  onClick={() => day && setSelectedDate(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${
                          isToday(day) ? 'text-blue-600' : 'text-slate-700'
                        }`}>
                          {day}
                        </span>
                        {dayPosts.length > 0 && (
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            {dayPosts.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Posts for this day */}
                      <div className="space-y-1">
                        {dayPosts.slice(0, 2).map((post) => (
                          <div
                            key={post.id}
                            className={`text-xs p-1.5 rounded border ${getPlatformBadgeColor(post.platform)} flex items-start gap-1`}
                          >
                            {getPlatformIcon(post.platform)}
                            <span className="line-clamp-2 flex-1">{post.title}</span>
                          </div>
                        ))}
                        
                        {dayPosts.length > 2 && (
                          <div className="text-xs text-slate-600 font-medium px-1.5">
                            +{dayPosts.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h4 className="font-bold text-slate-900 mb-4">Platform Legend</h4>
        <div className="flex flex-wrap gap-3">
          {[
            { platform: 'blog', label: 'SEO Blog', color: 'bg-purple-500' },
            { platform: 'instagram', label: 'Instagram', color: 'bg-pink-500' },
            { platform: 'linkedin', label: 'LinkedIn', color: 'bg-blue-500' },
            { platform: 'twitter', label: 'X / Twitter', color: 'bg-sky-500' },
            { platform: 'youtube', label: 'YouTube', color: 'bg-red-500' },
          ].map((item) => (
            <div key={item.platform} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${item.color}`}></div>
              <span className="text-sm text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900">
                Posts for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </h4>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            {posts.filter((p) => toLocalDateKey(p.scheduledDate) === selectedDate).map((post) => (
              <div
                key={post.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`px-3 py-1.5 rounded-lg border font-semibold text-sm flex items-center gap-2 ${getPlatformBadgeColor(post.platform)}`}>
                        {getPlatformIcon(post.platform)}
                        {post.type}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        post.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                        post.status === 'published' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 mb-2">{post.title}</h4>
                    
                    <div className="flex flex-wrap gap-1">
                      {post.keywords.map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
