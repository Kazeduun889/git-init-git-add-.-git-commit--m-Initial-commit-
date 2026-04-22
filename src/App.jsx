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

// --- Views ---

const ProfileView = ({ userData }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24">
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
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Requests</p>
          <p className="text-lg font-mono">0</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Status</p>
          <p className="text-lg font-mono text-green-400">Active</p>
        </div>
      </div>
    </div>
    
    <div className="space-y-4">
      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Top Up Balance</h3>
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
    <h2 className="text-2xl font-black italic tracking-tighter mb-2">AI MODELS</h2>
    {AI_MODELS.map((model) => (
      <div key={model.id} className="glass-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all border-white/5 hover:border-accent/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl border border-white/10 group-hover:border-accent/50 transition-colors shadow-inner">
            {model.icon}
          </div>
          <div>
            <h3 className="font-bold text-white tracking-wide">{model.name}</h3>
            <div className="flex gap-2 mt-1 items-center">
              <span className="text-[9px] bg-accent text-white px-1.5 py-0.5 rounded uppercase font-black">{model.provider}</span>
              <span className="text-[10px] text-gray-400 font-medium">{model.price}</span>
            </div>
          </div>
        </div>
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-accent group-hover:text-white transition-all text-gray-600">
            <Sparkles size={16} />
        </div>
      </div>
    ))}
  </motion.div>
);

const ApiView = ({ tgId }) => {
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    if (tgId) fetchKeys();
  }, [tgId]);

  const fetchKeys = async () => {
    const { data, error } = await supabase.from('api_keys').select('*').eq('user_id', tgId).order('created_at', { ascending: false });
    if (data) setKeys(data);
    if (error) alert("Fetch Error: " + error.message);
  };

  const createKey = async () => {
    if (!tgId) return alert("Wait for user data...");
    const newKeyValue = `nx_sk_${Math.random().toString(36).substring(2, 15)}`;
    const { data, error } = await supabase.from('api_keys').insert([
      { user_id: tgId, key_name: `Key ${keys.length + 1}`, key_value: newKeyValue }
    ]).select();
    
    if (data) {
        setKeys([...data, ...keys]);
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    }
    if (error) alert("Insert Error: " + error.message);
  };

  const deleteKey = async (id) => {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (!error) setKeys(keys.filter(k => k.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic tracking-tighter">API KEYS</h2>
        <ShieldCheck className="text-green-400" size={24} />
      </div>
      
      <button onClick={createKey} className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent hover:bg-accent/5 transition-all group">
        <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
        <span className="font-bold">Generate New API Key</span>
      </button>

      <div className="space-y-4">
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 space-y-3 border-white/5">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm text-gray-200">{k.key_name}</h4>
              <button onClick={() => deleteKey(k.id)} className="text-gray-600 hover:text-red-400 p-1">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5 font-mono text-[10px] text-accent overflow-hidden">
              <span className="truncate mr-2 uppercase tracking-tighter">{k.key_value}</span>
              <Copy size={14} className="text-gray-500 hover:text-white flex-shrink-0 cursor-pointer" onClick={() => {
                navigator.clipboard.writeText(k.key_value);
                alert("Copied!");
              }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.backgroundColor = '#0f172a';
      tg.headerColor = '#0f172a';
      
      const user = tg.initDataUnsafe?.user || { id: 12345, username: 'tester' };
      syncUser(user);
    }
  }, []);

  const syncUser = async (tgUser) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('telegram_id', tgUser.id).maybeSingle();
      
      if (error) {
        alert("Supabase Error: " + error.message);
        return;
      }

      if (!data) {
        const { data: newUser, error: insertError } = await supabase.from('profiles').insert([
          { telegram_id: tgUser.id, username: tgUser.username || 'user', stars_balance: 500 }
        ]).select().single();
        
        if (newUser) setUserData(newUser);
        if (insertError) alert("Registration Error: " + insertError.message);
      } else {
        setUserData(data);
      }
    } catch (err) {
      alert("App Crash: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#0f172a] text-white overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <ProfileView key="p" userData={userData} />}
          {activeTab === 'models' && <ModelsView key="m" />}
          {activeTab === 'api' && <ApiView key="a" tgId={userData?.telegram_id} />}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-card p-2 flex justify-between items-center z-50 shadow-2xl border-white/10">
        {[
          { id: 'home', icon: User, label: 'Profile' },
          { id: 'models', icon: LayoutGrid, label: 'Models' },
          { id: 'api', icon: Key, label: 'API' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
                setActiveTab(tab.id);
                window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light');
            }}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/40' : 'text-gray-500'}`}
          >
            <tab.icon size={20} />
            <span className="text-[10px] mt-1 font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}