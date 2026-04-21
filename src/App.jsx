import React, { useState, useEffect } from 'react';
import { User, LayoutGrid, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck, Key as KeyIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

const AI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', type: 'Chat', price: '1 ⭐', icon: '⚡' },
  { id: 'claude-3-haiku', name: 'Claude Haiku', provider: 'Anthropic', type: 'Chat', price: '1 ⭐', icon: '🎨' },
  { id: 'gemini-flash', name: 'Gemini 1.5 Flash', provider: 'Google', type: 'Fast', price: '0.5 ⭐', icon: '💎' },
  { id: 'llama-3-8b', name: 'Llama 3.1 8B', provider: 'Meta', type: 'Open', price: '0.2 ⭐', icon: '🦙' },
];

// --- Views ---

const ProfileView = ({ userData }) => (
  <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
    <div className="glass-card p-6 border-accent/20 bg-accent/5">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-accent to-purple-400 rounded-2xl flex items-center justify-center shadow-xl">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold italic">@{userData?.username || 'User'}</h2>
          <div className="flex items-center gap-1 text-yellow-400">
            <Sparkles size={14} fill="currentColor" />
            <span className="text-sm font-bold">{userData?.stars_balance || 0} Stars</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-400 uppercase font-bold text-center">Запросов</p>
          <p className="text-lg font-mono text-center">0</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-400 uppercase font-bold text-center">Статус</p>
          <p className="text-lg font-mono text-center text-green-400">Active</p>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Тарифы пополнения</h3>
      {[50, 250, 1000].map(amt => (
        <button key={amt} className="w-full glass-card p-4 flex justify-between items-center hover:bg-white/5 transition-all">
          <span className="font-bold">{amt} Stars</span>
          <Plus size={18} className="text-accent" />
        </button>
      ))}
    </div>
  </div>
);

const ModelsView = () => (
  <div className="p-6 space-y-4 pb-24 animate-in slide-in-from-bottom-4">
    <h2 className="text-2xl font-bold mb-4 italic">Available Models</h2>
    {AI_MODELS.map((model) => (
      <div key={model.id} className="glass-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl border border-white/10 group-hover:border-accent/50 transition-colors">
            {model.icon}
          </div>
          <div>
            <h3 className="font-bold text-white">{model.name}</h3>
            <div className="flex gap-2 mt-1 items-center">
              <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase font-black">{model.provider}</span>
              <span className="text-[10px] text-gray-400">{model.price} / req</span>
            </div>
          </div>
        </div>
        <Sparkles size={18} className="text-gray-600 group-hover:text-accent transition-colors" />
      </div>
    ))}
  </div>
);

const ApiView = ({ tgId }) => {
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    if (tgId) fetchKeys();
  }, [tgId]);

  const fetchKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', tgId);
    if (data) setKeys(data);
  };

  const createKey = async () => {
    const newKeyValue = `nx_sk_${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase.from('api_keys').insert([
      { user_id: tgId, key_name: `Key ${keys.length + 1}`, key_value: newKeyValue }
    ]).select();
    if (data) setKeys([...data, ...keys]);
  };

  return (
    <div className="p-6 space-y-6 pb-24 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">API Access</h2><ShieldCheck className="text-green-400" /></div>
      <button onClick={createKey} className="w-full glass-card border-dashed border-accent/40 p-4 flex items-center justify-center gap-2 text-accent hover:bg-accent/5 transition-all">
        <Plus size={20} /> <span className="font-semibold">Generate New Key</span>
      </button>
      <div className="space-y-4">
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm">{k.key_name}</h4>
              <Trash2 size={14} className="text-gray-600" />
            </div>
            <div className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2 border border-white/5 font-mono text-[10px] text-accent">
              {k.key_value} <Copy size={12} className="text-gray-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.backgroundColor = '#0f172a';
      const user = tg.initDataUnsafe?.user;
      if (user) syncUser(user);
    }
  }, []);

  const syncUser = async (tgUser) => {
    let { data } = await supabase.from('profiles').select('*').eq('telegram_id', tgUser.id).single();
    if (!data) {
      const { data: newUser } = await supabase.from('profiles').insert([
        { telegram_id: tgUser.id, username: tgUser.username || 'user', stars_balance: 500 }
      ]).select().single();
      setUserData(newUser);
    } else {
      setUserData(data);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <ProfileView userData={userData} />}
        {activeTab === 'models' && <ModelsView />}
        {activeTab === 'api' && <ApiView tgId={userData?.telegram_id} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-card p-2 flex justify-between items-center z-50 shadow-2xl">
        {[
          { id: 'home', icon: User, label: 'Profile' },
          { id: 'models', icon: LayoutGrid, label: 'Models' },
          { id: 'api', icon: Key, label: 'API' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-accent text-white shadow-lg' : 'text-gray-400'}`}
          >
            <tab.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}