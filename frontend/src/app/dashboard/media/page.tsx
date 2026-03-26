'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = () => {
    setLoading(true);
    api.get<any[]>('/media').then((d) => setMedia(d || [])).catch(() => setMedia([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchMedia(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.upload('/media/upload', fd);
      fetchMedia();
    } catch (err: any) { alert(err.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return;
    try { await api.delete(`/media/${id}`); setMedia((p) => p.filter((m) => m.id !== id)); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Media Library</h1>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-dark-300">Loading...</div>
      ) : media.length === 0 ? (
        <div className="bg-dark-800 border border-white/5 rounded-2xl text-center py-16">
          <div className="text-4xl mb-3">🖼</div>
          <p className="text-dark-300">No media uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div key={item.id} className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden group relative hover:border-white/10 transition-all">
              {item.type === 'IMAGE' ? (
                <img src={item.fileUrl} alt={item.fileName} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-dark-700 flex items-center justify-center text-dark-400 text-sm">{item.type}</div>
              )}
              <div className="p-3"><p className="text-xs text-dark-200 truncate">{item.fileName}</p></div>
              <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 bg-dark-900/80 text-dark-200 hover:text-red-400 rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
