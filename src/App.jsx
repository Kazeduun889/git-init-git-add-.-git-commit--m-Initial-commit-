import React, { useState, useEffect, useRef } from 'react';
import { User, LayoutGrid, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck, Send, Loader2, Menu, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

const AI_MODELS = [
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron Nano', provider: 'NVIDIA', price: '0.2 ⭐', icon: '🤖' },
];

// --- Компонент Профиля ---
const ProfileView = ({ userData }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-24 font-sans">
    <div className="glass-card p-6 border-accent/20 bg-accent/5 relative">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-accent to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">@{userData?.username || 'user'}</h2>
          <div className="flex items-center gap-1.5 text-yellow-400 mt-1">
            <Sparkles size={16} fill="currentColor" />
            <span className="text-sm font-black italic">{userData?.stars_balance?.toFixed(1) ?? 0} Звезд</span>
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Быстрое пополнение</h3>
      <div className="grid gap-3">
        {[50, 250, 1000].map(amt => (
          <button key={amt} className="w-full glass-card p-4 flex justify-between items-center border-white/5 active:scale-95 transition-all">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-yellow-500" fill="currentColor" />
              <span className="font-bold text-white text-sm">{amt} Звезд</span>
            </div>
            <Plus size={18} className="text-accent" />
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

// --- Компонент Чата ---
const ChatView = ({ userData, onUpdateBalance }) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (userData) loadChats(); }, [userData]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('user_id', userData.telegram_id).order('created_at', { ascending: false });
    if (data) setChats(data);
  };

  const startNewChat = async () => {
    if (chats.length >= 10) return alert("Превышен лимит (10 чатов). Удалите старые чаты.");
    const { data } = await supabase.from('chats').insert([{ user_id: userData.telegram_id, title: 'Новый чат' }]).select().single();
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
    if (currentChat?.id === id) {
      setCurrentChat(null);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChat) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data: keys } = await supabase.from('api_keys').select('key_value').eq('user_id', userData.telegram_id).limit(1);
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keys[0].key_value,
          messages: [...messages, userMsg].slice(-10), // Передаем контекст (последние 10 сообщений)
          model: AI_MODELS[0].id
        })
      });

      const data = await res.json();
      if (data.reply) {
        const assistantMsg = { role: 'assistant', content: data.reply };
        setMessages(prev => [...prev, assistantMsg]);
        // Сохраняем в БД
        await supabase.from('chat_messages').insert([
          { chat_id: currentChat.id, role: 'user', content: userMsg.content },
          { chat_id: currentChat.id, role: 'assistant', content: assistantMsg.content }
        ]);
        onUpdateBalance();
      } else {
        alert(data.error);
      }
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full font-sans relative">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/5">
        <h2 className="text-xl font-black uppercase tracking-tighter">Чат</h2>
        <button onClick={() => setIsHistoryOpen(true)} className="p-2 glass-card text-accent">
          <Menu size={20} />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {!currentChat && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <MessageSquare size={48} />
            <p className="text-sm">Выберите чат или создайте новый</p>
            <button onClick={startNewChat} className="bg-accent px-6 py-2 rounded-xl text-white font-bold">Начать</button>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-accent text-white rounded-tr-none' : 'glass-card border-white/10 rounded-tl-none'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-[10px] text-gray-500 animate-pulse font-bold uppercase">ИИ печатает...</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      {currentChat && (
        <div className="fixed bottom-24 left-0 w-full p-4 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="relative max-w-md mx-auto">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Спроси нейросеть..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 pr-14 focus:outline-none focus:border-accent/50 text-sm"
            />
            <button onClick={sendMessage} className="absolute right-2 top-2 p-2.5 bg-accent rounded-xl text-white">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* History Sidebar Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black/80 z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-4/5 bg-[#111] z-[70] p-6 shadow-2xl border-l border-white/5">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black uppercase tracking-widest text-sm">История чатов</h3>
                <X onClick={() => setIsHistoryOpen(false)} />
              </div>
              <button onClick={startNewChat} className="w-full py-3 glass-card border-dashed border-accent/40 text-accent font-bold text-xs uppercase mb-6 flex items-center justify-center gap-2">
                <Plus size={16} /> Новый чат
              </button>
              <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                {chats.map(c => (
                  <div key={c.id} className={`flex items-center gap-2 p-3 rounded-xl transition-all ${currentChat?.id === c.id ? 'bg-accent/20 border border-accent/50' : 'bg-white/5 border border-transparent'}`}>
                    <div onClick={() => selectChat(c)} className="flex-1 text-xs font-bold truncate cursor-pointer">{c.title}</div>
                    <Trash2 onClick={() => deleteChat(c.id)} size={14} className="text-gray-600 hover:text-red-500" />
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
  useEffect(() => { if (tgId) fetchKeys(); }, [tgId]);
  const fetchKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', tgId);
    if (data) setKeys(data);
  };
  return (
    <div className="p-6 space-y-6 pb-24 font-sans">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-black tracking-tighter uppercase">API Ключи</h2><ShieldCheck className="text-green-500" /></div>
      <button className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent font-bold text-[10px] uppercase tracking-widest">
        Генерация ключей доступна
      </button>
      <div className="space-y-3">
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 border-white/5 flex justify-between items-center font-mono text-[10px]">
            <span className="truncate mr-4 text-accent">{k.key_value}</span>
            <Copy size={14} className="text-gray-500" />
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
      const user = tg.initDataUnsafe?.user || { id: 12345, username: 'tester' };
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
          { id: 'chat', icon: LayoutGrid, label: 'Чат' },
          { id: 'api', icon: Key, label: 'API' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 ${activeTab === t.id ? 'bg-accent text-white' : 'text-gray-500'}`}>
            <t.icon size={18} />
            <span className="text-[9px] mt-1 font-black uppercase">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}