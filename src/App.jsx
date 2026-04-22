import React, { useState, useEffect } from 'react';
import { User, LayoutGrid, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

const AI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', price: '1 ⭐', icon: '⚡' },
  { id: 'claude-3-haiku', name: 'Claude Haiku', provider: 'Anthropic', price: '1 ⭐', icon: '🎨' },
  { id: 'gemini-flash', name: 'Gemini 1.5 Flash', provider: 'Google', price: '0.5 ⭐', icon: '💎' },
  { id: 'llama-3-8b', name: 'Llama 3.1 8B', provider: 'Meta', price: '0.2 ⭐', icon: '🦙' },
];

const ProfileView = ({ userData }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24">
    <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Version 1.4 Online</span>
    </div>
    
    <div className="glass-card p-6 border-accent/20 bg-accent/5 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-accent to-purple-400 rounded-2xl flex items-center justify-center shadow-xl shadow-accent/20">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold italic">@{userData?.username || 'user'}</h2>
          <div className="flex items-center gap-1 text-yellow-400">
            <Sparkles size={14} fill="currentColor" />
            <span className="text-sm font-bold">{userData?.stars_balance ?? 0} Stars</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-[8px]">Requests</p>
          <p className="text-lg font-mono">0</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-[8px]">Status</p>
          <p className="text-lg font-mono text-green-400 text-sm uppercase">Active</p>
        </div>
      </div>
    </div>
    
    <div className="space-y-4">
      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Deposit Stars</h3>
      {[50, 250, 1000].map(amt => (
        <button key={amt} className="w-full glass-card p-4 flex justify-between items-center hover:bg-white/10 active:scale-[0.98] transition-all border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500 font-bold text-xs">⭐</div>
            <span className="font-bold">{amt} Stars</span>
          </div>
          <Plus size={18} className="text-accent" />
        </button>
      ))}
    </div>
  </motion.div>
);

const ModelsView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-4 pb-24">
    <h2 className="text-2xl font-black italic tracking-tighter mb-2 italic uppercase tracking-widest">Models</h2>
    {AI_MODELS.map((m) => (
      <div key={m.id} className="glass-card p-4 flex items-center justify-between border-white/5 group active:scale-[0.98] transition-all">
        <div className="flex items-center gap-4">
          <div className="text-2xl w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl">{m.icon}</div>
          <div>
            <h3 className="font-bold">{m.name}</h3>
            <div className="flex gap-2">
                <span className="text-[9px] text-accent font-bold uppercase">{m.provider}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase">{m.price}</span>
            </div>
          </div>
        </div>
        <Sparkles size={16} className="text-gray-700" />
      </div>
    ))}
  </motion.div>
);

const ApiView = ({ tgId }) => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (tgId) fetchKeys(); }, [tgId]);

  const fetchKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', tgId).order('created_at', { ascending: false });
    if (data) setKeys(data);
  };

  const createKey = async () => {
    if (!tgId) return alert("Wait for Profile sync...");
    setLoading(true);
    const val = `nx_sk_${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase.from('api_keys').insert([{ user_id: tgId, key_name: `Key ${keys.length + 1}`, key_value: val }]).select();
    
    if (data) setKeys([...data, ...keys]);
    if (error) alert("DB Error: " + error.message);
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24 text-white">
      <h2 className="text-2xl font-black italic uppercase tracking-widest tracking-tighter">API Access</h2>
      <button 
        onClick={createKey} 
        disabled={loading}
        className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent active:scale-95 transition-all disabled:opacity-50"
      >
        <Plus size={20} /> <span className="font-bold tracking-widest uppercase text-xs">{loading ? 'Generating...' : 'Generate API Key'}</span>
      </button>
      
      <div className="space-y-4">
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 space-y-3 border-white/5 relative">
            <div className="flex justify-between items-center text-gray-500 uppercase font-black text-[9px] tracking-widest">
              <span>{k.key_name}</span>
            </div>
            <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5 font-mono text-[10px] text-accent">
                <span className="truncate">{k.key_value}</span>
                <Copy size={14} className="ml-2 flex-shrink-0 text-gray-600 hover:text-white" onClick={() => { navigator.clipboard.writeText(k.key_value); alert("Copied!"); }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.backgroundColor = '#0a0a0a';
      tg.headerColor = '#0a0a0a';
      const user = tg.initDataUnsafe?.user || { id: 12345, username: 'local_tester' };
      syncUser(user);
    }
  }, []);

  const syncUser = async (tgUser) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('telegram_id', tgUser.id).maybeSingle();
      if (!data) {
        const { data: newUser } = await supabase.from('profiles').insert([{ telegram_id: tgUser.id, username: tgUser.username || 'user', stars_balance: 500 }]).select().single();
        setUserData(newUser);
      } else {
        setUserData(data);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto pt-4">
        <AnimatePresence mode="wait">
            {activeTab === 'home' && <ProfileView key="p" userData={userData} />}
            {activeTab === 'models' && <ModelsView key="m" />}
            {activeTab === 'api' && <ApiView key="a" tgId={userData?.telegram_id} />}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-card p-2 flex justify-between items-center z-50 border-white/10 shadow-2xl backdrop-blur-xl bg-black/50">
        {[
          { id: 'home', icon: User, label: 'Profile' },
          { id: 'models', icon: LayoutGrid, label: 'Models' },
          { id: 'api', icon: Key, label: 'API' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => {
                setActiveTab(t.id);
                window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light');
            }} 
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 ${activeTab === t.id ? 'bg-accent text-white shadow-lg shadow-accent/40 scale-105' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <t.icon size={20} />
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}