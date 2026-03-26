'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const platformColors: Record<string, string> = {
  twitter: 'bg-blue-500',
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-gray-800',
  youtube: 'bg-red-500',
  threads: 'bg-gray-600',
  bluesky: 'bg-sky-500',
  pinterest: 'bg-red-600',
};

const platformIcons: Record<string, string> = {
  twitter: '𝕏',
  instagram: '📸',
  facebook: 'f',
  linkedin: 'in',
  tiktok: '♪',
  youtube: '▶',
  threads: '@',
  bluesky: '🦋',
  pinterest: '📌',
};

const statusColors: Record<string, string> = {
  DRAFT: 'border-l-dark-400',
  SCHEDULED: 'border-l-amber-400',
  POSTED: 'border-l-emerald-400',
  FAILED: 'border-l-red-400',
};

export default function ContentCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const data = await api.get<any>(`/posts?limit=200`);
      setPosts(data.posts || data || []);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [currentDate]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return posts.filter((post: any) => {
      const postDate = new Date(post.scheduledTime || post.createdAt);
      return postDate.getDate() === date.getDate() &&
             postDate.getMonth() === date.getMonth() &&
             postDate.getFullYear() === date.getFullYear();
    });
  };

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null); // empty cells before month starts
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  // Week view: get current week
  const getWeekDates = () => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  // Count posts by status
  const postStats = {
    total: posts.length,
    scheduled: posts.filter((p: any) => p.status === 'SCHEDULED').length,
    posted: posts.filter((p: any) => p.status === 'POSTED').length,
    draft: posts.filter((p: any) => p.status === 'DRAFT').length,
  };

  const selectedDayPosts = selectedDay ? getPostsForDate(selectedDay) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
          <p className="text-sm text-dark-300 mt-1">Plan and visualize your content schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-dark-800 border border-white/10 rounded-xl p-1">
            <button onClick={() => setView('month')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'month' ? 'bg-primary-500 text-white' : 'text-dark-300 hover:text-white'}`}>Month</button>
            <button onClick={() => setView('week')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'week' ? 'bg-primary-500 text-white' : 'text-dark-300 hover:text-white'}`}>Week</button>
          </div>
          <button onClick={() => router.push('/dashboard/posts/create')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-xl text-sm hover:opacity-90 transition-opacity">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Post
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Posts', value: postStats.total, color: 'text-white' },
          { label: 'Scheduled', value: postStats.scheduled, color: 'text-amber-400' },
          { label: 'Published', value: postStats.posted, color: 'text-emerald-400' },
          { label: 'Drafts', value: postStats.draft, color: 'text-dark-300' },
        ].map((s) => (
          <div key={s.label} className="bg-dark-800 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar Navigation */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg font-bold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-dark-200 hover:text-white rounded-lg transition-all">
            Today
          </button>
        </div>

        {view === 'month' ? (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/5">
              {DAYS.map((d) => (
                <div key={d} className="py-2.5 text-center text-xs font-medium text-dark-400">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => {
                if (!date) {
                  return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-white/5 bg-dark-900/30" />;
                }

                const dayPosts = getPostsForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDay?.toDateString() === date.toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : date)}
                    className={`min-h-[100px] border-b border-r border-white/5 p-1.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary-500/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-primary-500 text-white' : 'text-dark-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map((post: any) => (
                        <div
                          key={post.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded border-l-2 bg-dark-700/50 truncate ${statusColors[post.status] || 'border-l-dark-500'}`}
                        >
                          <span className="mr-1">{platformIcons[post.platform] || ''}</span>
                          {post.content?.slice(0, 25) || 'Untitled'}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <p className="text-[9px] text-dark-400 pl-1">+{dayPosts.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Week View */
          <div className="grid grid-cols-7">
            {weekDates.map((date) => {
              const dayPosts = getPostsForDate(date);
              const isToday = date.toDateString() === today.toDateString();

              return (
                <div key={date.toISOString()} className="border-r border-white/5 last:border-r-0">
                  <div className={`text-center py-3 border-b border-white/5 ${isToday ? 'bg-primary-500/10' : ''}`}>
                    <p className="text-[10px] text-dark-400 uppercase">{DAYS[date.getDay()]}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary-400' : 'text-white'}`}>{date.getDate()}</p>
                  </div>
                  <div className="p-2 min-h-[300px] space-y-1.5">
                    {dayPosts.map((post: any) => (
                      <div
                        key={post.id}
                        className={`p-2 rounded-lg border-l-2 bg-dark-700/50 cursor-pointer hover:bg-dark-700 transition-colors ${statusColors[post.status] || 'border-l-dark-500'}`}
                        onClick={() => router.push(`/dashboard/posts`)}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`w-4 h-4 rounded text-[8px] flex items-center justify-center ${platformColors[post.platform] || 'bg-dark-600'} text-white`}>
                            {platformIcons[post.platform] || '?'}
                          </span>
                          <span className="text-[10px] text-dark-400">
                            {new Date(post.scheduledTime || post.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-dark-200 line-clamp-2">{post.content?.slice(0, 60) || 'Untitled'}</p>
                      </div>
                    ))}
                    {dayPosts.length === 0 && (
                      <p className="text-[10px] text-dark-500 text-center mt-8">No posts</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Detail */}
      {selectedDay && (
        <div className="mt-4 bg-dark-800 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">
              {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <span className="text-xs text-dark-400">{selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? 's' : ''}</span>
          </div>
          {selectedDayPosts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-dark-400 mb-3">No posts scheduled for this day</p>
              <button onClick={() => router.push('/dashboard/posts/create')} className="px-4 py-2 bg-primary-500/15 text-primary-400 text-sm font-medium rounded-xl hover:bg-primary-500/25 transition-colors">
                Schedule a post
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayPosts.map((post: any) => (
                <div key={post.id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                  <span className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center ${platformColors[post.platform] || 'bg-dark-600'} text-white`}>
                    {platformIcons[post.platform] || '?'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{post.content?.slice(0, 80) || 'Untitled'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        post.status === 'POSTED' ? 'bg-emerald-500/15 text-emerald-400' :
                        post.status === 'SCHEDULED' ? 'bg-amber-500/15 text-amber-400' :
                        post.status === 'FAILED' ? 'bg-red-500/15 text-red-400' :
                        'bg-dark-600 text-dark-300'
                      }`}>{post.status}</span>
                      <span className="text-[10px] text-dark-400">
                        {new Date(post.scheduledTime || post.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
