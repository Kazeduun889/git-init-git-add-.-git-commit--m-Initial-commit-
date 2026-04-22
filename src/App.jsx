import React, { useState, useEffect, useRef } from 'react';
import { User, LayoutGrid, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck, Send, Loader2, Menu, X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

const AI_MODELS = [
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron Nano', provider: 'NVIDIA', price: '0.2 ⭐', icon: '🤖' },
];

const RECHARGE_PACKS = [
  { amt: 10 }, { amt: 25 }, { amt: 50 }, { amt: 100 }, 
  { amt: 150 }, { amt: 250 }, { amt: 350 }, { amt: 500 }
];

// --- Вкладка Профиль ---
const ProfileView = ({ userData }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24 font-sans">
    <div className="glass-card p-6 border-accent/20 bg-accent/5 relative">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-accent to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">@{userData?.username || 'пользователь'}</h2>
          <div className="flex items-center gap-1.5 text-yellow-400 mt-1">
            <Sparkles size={16} fill="currentColor" />
            <span className="text-sm font-black">{userData?.stars_balance?.toFixed(1) ?? 0} Звезд</span>
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-1 font-mono">Пополнение баланса</h3>
      <div className="grid grid-cols-2 gap-3">
        {RECHARGE_PACKS.map(pack => (
          <button key={pack.amt} className="glass-card p-4 flex flex-col items-center justify-center gap-2 border-white/5 active:scale-95 transition-all hover:border-accent/30">
            <Sparkles size={20} className="text-yellow-500" fill="currentColor" />
            <span className="font-bold text-white text-sm">{pack.amt} Звезд</span>
            <span className="text-[9px] text-accent font-bold uppercase">Купить</span>
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

// --- Вкладка Чата ---
const ChatView = ({ userData, onUpdateBalance }) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const scrollRef = useRef(null);

  useEffect(() => { if (userData) loadChats(); }, [userData]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('user_id', userData.telegram_id).order('created_at', { ascending: false });
    if (data) setChats(data);
  };

  const startNewChat = async () => {
    if (chats.length >= 10) return alert("Лимит 10 чатов. Удалите старые.");
    const { data } = await supabase.from('chats').insert([{ user_id: userData.telegram_id, title: `Чат #${chats.length + 1}` }]).select().single();
    if (data) {
      setChats([data, ...chats]);
      selectChat(data);
    }
  };

  const selectChat = async (chat) => {
    setCurrentChat(chat);
    setIsHistoryOpen(false);
    const { data } = await supabase.from('chat_messages').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const deleteChat = async (id) => {
    await supabase.from('chats').delete().eq('id', id);
    setChats(chats.filter(c => c.id !== id));
    if (currentChat?.id === id) { setCurrentChat(null); setMessages([]); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChat || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data: keys } = await supabase.from('api_keys').select('key_value').eq('user_id', userData.telegram_id).limit(1);
      if (!keys?.[0]) throw new Error("Создайте API ключ во вкладке API");

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keys[0].key_value,
          messages: [...messages, userMsg].slice(-10),
          model: selectedModel.id
        })
      });

      const data = await res.json();
      if (data.reply) {
        const assistantMsg = { role: 'assistant', content: data.reply };
        setMessages(prev => [...prev, assistantMsg]);
        await supabase.from('chat_messages').insert([
          { chat_id: currentChat.id, role: 'user', content: userMsg.content },
          { chat_id: currentChat.id, role: 'assistant', content: assistantMsg.content }
        ]);
        onUpdateBalance();
      } else throw new Error(data.error || "Ошибка сервера");
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full font-sans relative">
      <header className="p-4 flex flex-col border-b border-white/5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter">Чат</h2>
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 glass-card text-accent"><Menu size={20} /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {AI_MODELS.map(m => (
            <button key={m.id} onClick={() => setSelectedModel(m)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${selectedModel.id === m.id ? 'bg-accent border-accent text-white' : 'glass-card border-white/5 text-gray-500'}`}>
              {m.name} ({m.price})
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {!currentChat ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <MessageSquare size={48} /><p className="text-sm">Выберите чат в истории или создайте новый</p>
            <button onClick={startNewChat} className="bg-accent px-8 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest">Начать общение</button>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-accent text-white rounded-tr-none shadow-lg' : 'glass-card border-white/10 rounded-tl-none text-gray-200'}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && <div className="text-[10px] text-accent animate-pulse font-bold uppercase tracking-widest">ИИ думает...</div>}
        <div ref={scrollRef} />
      </div>

      {currentChat && (
        <div className="fixed bottom-24 left-0 w-full p-4 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="relative max-w-md mx-auto flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Задайте вопрос..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-accent/50 text-sm" />
            <button onClick={sendMessage} className="p-4 bg-accent rounded-2xl text-white active:scale-90 transition-all"><Send size={18} /></button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black/80 z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-4/5 bg-[#0f0f0f] z-[70] p-6 shadow-2xl border-l border-white/5">
              <div className="flex justify-between items-center mb-8"><h3 className="font-black uppercase tracking-widest text-xs">История чатов</h3><X onClick={() => setIsHistoryOpen(false)} /></div>
              <button onClick={startNewChat} className="w-full py-4 glass-card border-dashed border-accent/40 text-accent font-black text-[10px] uppercase mb-6 flex items-center justify-center gap-2 tracking-widest"><Plus size={16} /> Создать чат</button>
              <div className="space-y-3 overflow-y-auto max-h-[75vh]">
                {chats.map(c => (
                  <div key={c.id} className={`flex items-center gap-2 p-3 rounded-xl transition-all ${currentChat?.id === c.id ? 'bg-accent/20 border border-accent/50' : 'bg-white/5 border border-transparent'}`}>
                    <div onClick={() => selectChat(c)} className="flex-1 text-[11px] font-bold truncate cursor-pointer text-gray-200 uppercase tracking-tight">{c.title}</div>
                    <Trash2 onClick={() => deleteChat(c.id)} size={14} className="text-gray-600 hover:text-red-500 transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Вкладка API ---
const ApiView = ({ tgId }) => {
  const [keys, setKeys] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { if (tgId) fetchKeys(); }, [tgId]);

  const fetchKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', tgId).order('created_at', { ascending: false });
    if (data) setKeys(data);
  };

  const createKey = async () => {
    if (!tgId || isGenerating) return;
    setIsGenerating(true);
    const val = `nx_sk_${Math.random().toString(36).substring(2, 15)}`;
    const { data, error } = await supabase.from('api_keys').insert([{ user_id: tgId, key_name: `Ключ #${keys.length + 1}`, key_value: val }]).select();
    if (data) setKeys([...data, ...keys]);
    if (error) alert("Ошибка создания ключа");
    setIsGenerating(false);
  };

  return (
    <div className="p-6 space-y-6 pb-24 font-sans">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-black tracking-tighter uppercase">API Доступ</h2><ShieldCheck className="text-green-500" /></div>
      <button onClick={createKey} disabled={isGenerating} className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
        {isGenerating ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
        {isGenerating ? 'Генерация...' : 'Создать API Ключ'}
      </button>
      <div className="space-y-4">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-1 font-mono">Ваши ключи</p>
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 border-white/5 flex flex-col space-y-2">
            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{k.key_name}</span></div>
            <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5 font-mono text-[10px] text-accent">
              <span className="truncate mr-4">{k.key_value}</span>
              <Copy size={14} className="text-gray-500 hover:text-white cursor-pointer" onClick={() => { navigator.clipboard.writeText(k.key_value); alert("Скопировано"); }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);

  const syncUser = async (tgUser) => {
    let { data } = await supabase.from('profiles').select('*').eq('telegram_id', tgUser.id).maybeSingle();
    if (!data) {
      const { data: newUser } = await supabase.from('profiles').insert([{ telegram_id: tgUser.id, username: tgUser.username || 'user', stars_balance: 5 }]).select().single();
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
      syncUser(user);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <ProfileView key="p" userData={userData} />}
          {activeTab === 'chat' && <ChatView key="c" userData={userData} onUpdateBalance={() => syncUser({ id: userData.telegram_id })} />}
          {activeTab === 'api' && <ApiView key="a" tgId={userData?.telegram_id} />}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-card p-2 flex justify-between items-center z-50 border-white/10 shadow-2xl backdrop-blur-xl bg-black/60">
        {[
          { id: 'home', icon: User, label: 'Профиль' },
          { id: 'chat', icon: MessageSquare, label: 'Чат' },
          { id: 'api', icon: Key, label: 'API' }
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light'); }} className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 ${activeTab === t.id ? 'bg-accent text-white shadow-lg shadow-accent/40' : 'text-gray-500'}`}>
            <t.icon size={18} />
            <span className="text-[9px] mt-1 font-black uppercase tracking-tight">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}