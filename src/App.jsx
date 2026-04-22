import React, { useState, useEffect } from 'react';
import { User, LayoutGrid, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

const AI_MODELS = [
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron-3 Nano', provider: 'NVIDIA', price: '0.2 ⭐', icon: '🤖' },
];

// --- Вкладка Профиль ---
const ProfileView = ({ userData }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24">
    <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-white/50 font-mono">Система активна • v.1.6</span>
    </div>
    <div className="glass-card p-6 border-accent/20 bg-accent/5 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-accent to-purple-400 rounded-2xl flex items-center justify-center shadow-xl shadow-accent/20">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">@{userData?.username || 'пользователь'}</h2>
          <div className="flex items-center gap-1 text-yellow-400">
            <Sparkles size={14} fill="currentColor" />
            <span className="text-sm font-bold tracking-tight">{userData?.stars_balance ?? 0} Звезд доступно</span>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-4 pt-2">
      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 font-mono">Быстрое пополнение</h3>
      <div className="grid grid-cols-1 gap-3">
        {[50, 250, 1000].map(amt => (
          <button key={amt} className="w-full glass-card p-4 flex justify-between items-center border-white/5 active:scale-95 transition-all">
            <span className="font-bold text-white tracking-wide">{amt} Звезд</span>
            <Plus size={18} className="text-accent" />
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

// --- Вкладка Чат (Модели) ---
const ModelsView = ({ userData, onUpdateBalance }) => {
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleTestChat = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data: keys } = await supabase.from('api_keys').select('key_value').eq('user_id', userData.telegram_id).limit(1);
      
      if (!keys || keys.length === 0) {
        alert("Сначала создайте API ключ во вкладке API!");
        setLoading(false);
        return;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keys[0].key_value,
          prompt: prompt,
          model: selectedModel.id
        })
      });

      const data = await res.json();
      if (data.reply) {
        setResponse(data.reply);
        onUpdateBalance();
      } else {
        alert("Ошибка: " + (data.error || "Неизвестная ошибка"));
      }
    } catch (e) {
      alert("Системная ошибка: " + e.message);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24">
      <h2 className="text-2xl font-black tracking-tighter uppercase font-mono">Песочница</h2>
      
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {AI_MODELS.map(m => (
          <button 
            key={m.id} 
            onClick={() => setSelectedModel(m)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border text-[10px] font-bold transition-all ${selectedModel.id === m.id ? 'bg-accent border-accent text-white' : 'glass-card border-white/5 text-gray-500'}`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="glass-card p-4 border-white/5 space-y-4">
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Введите ваш запрос здесь..."
          className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent/50 min-h-[100px] resize-none"
        />
        <button 
          onClick={handleTestChat}
          disabled={loading || !prompt}
          className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          {loading ? 'Обработка...' : `Запустить генерацию (${selectedModel.price})`}
        </button>
      </div>

      {response && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 border-accent/20 bg-accent/5">
          <p className="text-[10px] uppercase font-black text-accent mb-2 tracking-widest">Ответ нейросети</p>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{response}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Вкладка API Ключи ---
const ApiView = ({ tgId }) => {
  const [keys, setKeys] = useState([]);
  useEffect(() => { if (tgId) fetchKeys(); }, [tgId]);
  const fetchKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', tgId).order('created_at', { ascending: false });
    if (data) setKeys(data);
  };
  const createKey = async () => {
    const val = `nx_sk_${Math.random().toString(36).substring(2, 15)}`;
    const { data } = await supabase.from('api_keys').insert([{ user_id: tgId, key_name: `Ключ ${keys.length + 1}`, key_value: val }]).select();
    if (data) setKeys([...data, ...keys]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-black tracking-tighter uppercase font-mono text-white">API Доступ</h2><ShieldCheck className="text-green-500" /></div>
      <button onClick={createKey} className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent active:scale-95 transition-all uppercase font-bold text-[10px] tracking-widest">
        <Plus size={18} /> Создать секретный ключ
      </button>
      <div className="space-y-3">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 font-mono">Ваши активные ключи</p>
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 border-white/5 flex justify-between items-center">
            <code className="text-[10px] text-accent font-mono truncate mr-4 uppercase">{k.key_value}</code>
            <Copy size={14} className="text-gray-500 cursor-pointer hover:text-white" onClick={() => { 
                navigator.clipboard.writeText(k.key_value); 
                alert("Скопировано!"); 
            }} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// --- Главный компонент ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  const fetchUser = async (tgUser) => {
    let { data } = await supabase.from('profiles').select('*').eq('telegram_id', tgUser.id).maybeSingle();
    if (!data) {
      const { data: newUser } = await supabase.from('profiles').insert([{ telegram_id: tgUser.id, username: tgUser.username || 'user', stars_balance: 500 }]).select().single();
      setUserData(newUser);
    } else {
      setUserData(data);
    }
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.headerColor = '#0a0a0a';
      tg.backgroundColor = '#0a0a0a';
      const user = tg.initDataUnsafe?.user || { id: 12345, username: 'тестер' };
      fetchUser(user);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <ProfileView key="p" userData={userData} />}
          {activeTab === 'models' && <ModelsView key="m" userData={userData} onUpdateBalance={() => fetchUser({ id: userData.telegram_id })} />}
          {activeTab === 'api' && <ApiView key="a" tgId={userData?.telegram_id} />}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-card p-2 flex justify-between items-center z-50 border-white/10 shadow-2xl backdrop-blur-xl bg-black/60">
        {[
          { id: 'home', icon: User, label: 'Профиль' },
          { id: 'models', icon: LayoutGrid, label: 'Чат' },
          { id: 'api', icon: Key, label: 'API' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => { setActiveTab(t.id); window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light'); }}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 ${activeTab === t.id ? 'bg-accent text-white shadow-lg shadow-accent/40 scale-105' : 'text-gray-500'}`}
          >
            <t.icon size={20} />
            <span className="text-[10px] mt-1 font-black uppercase tracking-tighter">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}