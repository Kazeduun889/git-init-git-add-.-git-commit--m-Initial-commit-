import React, { useState, useEffect } from 'react';
import { User, LayoutGrid, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck, Key as KeyIcon } from 'lucide-react';
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
    <div className="absolute top-2 right-2 text-[10px] text-white/20 uppercase font-bold">VER 1.3</div>
    <div className="glass-card p-6 border-accent/20 bg-accent/5">
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
        <div className="bg-white/5 p-3 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 uppercase font-bold">Requests</p><p className="text-lg font-mono">0</p></div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 uppercase font-bold">Status</p><p className="text-lg font-mono text-green-400">Active</p></div>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Top Up Balance</h3>
      {[50, 250, 1000].map(amt => (
        <button key={amt} className="w-full glass-card p-4 flex justify-between items-center hover:bg-white/10 active:scale-[0.98] transition-all border-white/5">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500 font-bold text-xs">⭐</div><span className="font-bold">{amt} Stars</span></div>
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
      <div key={m.id} className="glass-card p-4 flex items-center justify-between border-white/5"><div className="flex items-center gap-4"><div className="text-2xl">{m.icon}</div><div><h3 className="font-bold">{m.name}</h3><span className="text-[10px] text-gray-400 uppercase tracking-tighter">{m.provider} — {m.price}</span></div></div><Sparkles size={16} className="text-gray-500" /></div>
    ))}
  </motion.div>
);

const ApiView = ({ tgId }) => {
  const [keys, setKeys] = useState([]);
  useEffect(() => { if (tgId) fetchKeys(); }, [tgId]);
  const fetchKeys = async () => {
    const { data, error } = await supabase.from('api_keys').select('*').eq('user_id', tgId);
    if (data) setKeys(data);
    if (error) alert("DB Error (fetch): " + error.message);
  };
  const createKey = async () => {
    if (!tgId) return alert("User ID missing!");
    const val = `nx_sk_${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase.from('api_keys').insert([{ user_id: tgId, key_name: `Key ${keys.length + 1}`, key_value: val }]).select();
    if (data) setKeys([...data, ...keys]);
    if (error) alert("DB Error (insert): " + error.message);
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24">
      <h2 className="text-2xl font-black italic italic uppercase tracking-widest">API Access</h2>
      <button onClick={createKey} className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent active:scale-95 transition-all"><Plus size={20} /> <span className="font-bold tracking-widest uppercase text-xs">Generate Key</span></button>
      <div className="space-y-4">{keys.map(k => (
        <div key={k.id} className="glass-card p-4 space-y-2 border-white/5 text-[10px] font-mono text-accent flex justify-between items-center"><span>{k.key_value}</span><Copy size={12} className="text-gray-500" onClick={() => { navigator.clipboard.writeText(k.key_value); alert("Copied!"); }}/></div>
      ))}</div>
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
      const user = tg.initDataUnsafe?.user || { id: 12345, username: 'tester_local' };
      syncUser(user);
    }
  }, []);

  const syncUser = async (tgUser) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('telegram_id', tgUser.id).maybeSingle();
      if (error) return alert("Supabase Fetch Error: " + error.message);
      if (!data) {
        const { data: newUser, error: insErr } = await supabase.from('profiles').insert([{ telegram_id: tgUser.id, username: tgUser.username || 'user', stars_balance: 500 }]).select().single();
        if (insErr) alert("Supabase Insert Error: " + insErr.message);
        else setUserData(newUser);
      } else {
        setUserData(data);
      }
    } catch (e) { alert("Catch error: " + e.message); }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto pt-4">
        {activeTab === 'home' && <ProfileView userData={userData} />}
        {activeTab === 'models' && <ModelsView />}
        {activeTab === 'api' && <ApiView tgId={userData?.telegram_id} />}
      </main>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-card p-2 flex justify-between items-center z-50 border-white/10 shadow-2xl">
        {[{ id: 'home', icon: User, l: 'Profile' }, { id: 'models', icon: LayoutGrid, l: 'Models' }, { id: 'api', icon: Key, l: 'API' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === t.id ? 'bg-accent text-white shadow-lg shadow-accent/40 scale-105' : 'text-gray-500'}`}>
            <t.icon size={20} /><span className="text-[9px] mt-1 font-black uppercase">{t.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}