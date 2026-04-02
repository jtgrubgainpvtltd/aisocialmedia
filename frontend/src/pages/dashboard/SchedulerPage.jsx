import { useState, useEffect } from 'react';
import { posts, content as contentApi } from '../../api/client';
import { useToast, ToastContainer } from '../../components/Toast';

const NAVY = '#1a2332';

export default function SchedulerPage() {
  const { toasts, toast } = useToast();
  const [allPosts, setAllPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const tabs = ['All', 'Scheduled', 'Failed'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch only from Scheduled (PENDING/FAILED) source
      const scheduledRes = await posts.getScheduled().catch(err => {
        console.error("Scheduled Fetch Error:", err);
        return { data: { data: [] } };
      });

      // Safe Data Parsing
      const scheduledData = Array.isArray(scheduledRes.data?.data) 
        ? scheduledRes.data.data 
        : [];
        
      // Normalize only scheduled data
      const normalizedScheduled = scheduledData.map(p => ({
        id: `scheduled-${p.id}`,
        realId: p.id,
        platform: p.platform || 'Platform',
        content: p.caption,
        status: p.status === 'PENDING' ? 'Scheduled' : (p.status === 'FAILED' ? 'Failed' : p.status),
        time: `${new Date(p.scheduled_date).toLocaleDateString()} ${p.scheduled_time}`,
        img: p.image_url,
        rawType: 'scheduled',
        rawDate: new Date(p.scheduled_date)
      }));

      const merged = [...normalizedScheduled].sort((a, b) => {
        const dateA = a.rawDate instanceof Date && !isNaN(a.rawDate) ? a.rawDate.getTime() : 0;
        const dateB = b.rawDate instanceof Date && !isNaN(b.rawDate) ? b.rawDate.getTime() : 0;
        return dateA - dateB; // Sort ascending for upcoming tasks
      });

      setAllPosts(merged);
    } catch (err) {
      console.error('Fetch Error (Scheduler Pipeline):', err);
      setError('Could not load scheduled posts. Sync fail.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (post) => {
    if (post.rawType !== 'scheduled') {
      toast.info('Only scheduled posts can be cancelled at this time.');
      return;
    }
    
    try {
      await posts.cancelScheduled(post.realId);
      toast.success('Post cancelled successfully.');
      fetchData(); // Refresh list
    } catch (err) {
      toast.error('Failed to cancel post.');
    }
  };

  const filteredPosts = activeFilter === 'All' 
    ? allPosts 
    : allPosts.filter(p => p.status === activeFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Scheduled': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Drafts': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Failed': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getPlatformIcon = (platform) => {
    const p = (platform || '').toUpperCase();
    if (p.includes('INSTAGRAM')) return '📸';
    if (p.includes('FACEBOOK')) return '📘';
    if (p.includes('TWITTER') || p.includes('X')) return '🐦';
    if (p.includes('GOOGLE')) return '📍';
    return '📝';
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#FBFBFA]">
      <div className="mb-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 style={{ fontFamily: 'Unbounded, sans-serif' }} className="font-black text-3xl tracking-tight text-slate-900">
              Scheduler
            </h1>
            <p className="font-sans text-sm text-slate-500 mt-2">Live connection to your content database and platform statuses.</p>
          </div>
          <button onClick={fetchData} disabled={isLoading} className="bg-[#1a2332] text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight hover:scale-[1.02] transition-all flex items-center gap-2">
            {isLoading ? 'Refreshing...' : 'Refresh Pipeline'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-white/50 p-1.5 rounded-2xl border border-slate-100 w-fit backdrop-blur-sm">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-6 py-2 rounded-xl transition-all duration-300 font-bold text-xs tracking-tight ${
              activeFilter === tab 
                ? 'bg-white text-[#1a2332] shadow-sm ring-1 ring-slate-100' 
                : 'text-slate-400 opacity-60 hover:opacity-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1a2332] rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Accessing Database...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-40 bg-rose-50 rounded-[40px] border border-rose-100">
          <p className="text-rose-600 font-bold mb-2">{error}</p>
          <button onClick={fetchData} className="text-rose-500 text-xs font-black uppercase underline">Try Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div 
              key={post.id} 
              className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col transform hover:-translate-y-1"
            >
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner ring-1 ring-slate-100">
                      {getPlatformIcon(post.platform || 'General')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 capitalize">{(post.platform || 'Platform').toLowerCase()}</h3>
                      <p className="text-[0.65rem] font-mono text-slate-400 uppercase tracking-wider">{post.time}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest border ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 min-h-[4.5rem]">
                  {post.content || "No caption provided"}
                </p>
              </div>

              {post.img ? (
                <div className="mx-6 h-40 rounded-2xl overflow-hidden mb-4 ring-1 ring-slate-100">
                  <img src={post.img} alt="Post preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ) : (
                <div className="mx-6 h-40 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-100 mb-4">
                  <p className="text-slate-300 text-[0.65rem] uppercase tracking-widest font-mono">No Media Asset</p>
                </div>
              )}

              <div className="mt-auto border-t border-slate-50 p-4 bg-slate-50/30 flex items-center justify-between gap-3">
                <button className="flex-1 py-1.5 rounded-lg text-slate-500 text-[0.6rem] font-black uppercase tracking-[0.05em] hover:bg-white hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
                  View Post
                </button>
                <button className="flex-1 py-1.5 rounded-lg text-slate-500 text-[0.6rem] font-black uppercase tracking-[0.05em] hover:bg-white hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(post)}
                  className="flex-1 py-1.5 rounded-lg text-rose-300 text-[0.6rem] font-black uppercase tracking-[0.05em] hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4 grayscale opacity-50 italic">📅</div>
          <h2 className="font-bold text-slate-900">No {activeFilter} items found</h2>
          <p className="text-slate-400 text-sm mt-1">Total pipeline sync complete. No entries in this category.</p>
        </div>
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
}