import React, { useState, useEffect, useRef } from 'react';
import { User, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck, Send, Loader2, Menu, X, MessageSquare, BookOpen, Terminal, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from './supabaseClient';

const AI_MODELS = [
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano 30B', provider: 'NVIDIA', price: '0.2', icon: '🤖' },
];

const RECHARGE_PACKS = [
  { amt: 10 }, { amt: 25 }, { amt: 50 }, { amt: 100 }, 
  { amt: 150 }, { amt: 250 }, { amt: 350 }, { amt: 500 }
];

// --- Вкладка Профиль ---
const ProfileView = ({ userData }) => {
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async (amount) => {
    if (!userData || isPaying) return;
    setIsPaying(true);
    try {
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: userData.telegram_id })
      });
      const data = await response.json();
      if (data.link) {
        window.Telegram.WebApp.openInvoice(data.link, (status) => {
          if (status === 'paid') alert('Звезды зачислены!');
          setIsPaying(false);
        });
      } else {
        alert("Ошибка: " + data.error);
        setIsPaying(false);
      }
    } catch (e) {
      alert("Ошибка сети: " + e.message);
      setIsPaying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-32 font-sans">
      <div className="glass-card p-6 border-accent/20 bg-accent/5 relative text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-accent to-purple-500 rounded-3xl flex items-center justify-center shadow-xl mb-4">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">@{userData?.username || 'user'}</h2>
          <div className="flex items-center gap-1.5 text-yellow-400 mt-2 font-black bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
            <Sparkles size={16} fill="currentColor" />
            <span>{userData?.stars_balance?.toFixed(1) ?? 0} Звезд</span>
          </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-1 font-mono">Пополнение баланса</h3>
        <div className="grid grid-cols-2 gap-3">
          {RECHARGE_PACKS.map(pack => (
            <button 
              key={pack.amt} 
              onClick={() => handlePayment(pack.amt)}
              className="glass-card p-4 flex flex-col items-center justify-center gap-2 border-white/5 active:scale-95 transition-all hover:border-accent/30"
            >
              <Sparkles size={20} className="text-yellow-500" fill="currentColor" />
              <span className="font-bold text-white text-sm">{pack.amt} Звезд</span>
              <span className="text-[9px] text-accent font-black uppercase tracking-widest">Купить</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- Вкладка Чата ---
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
    if (chats.length >= 10) return alert("Лимит 10 чатов. Удалите старые.");
    const { data } = await supabase.from('chats').insert([{ user_id: userData.telegram_id, title: `Чат #${chats.length + 1}` }]).select().single();
    if (data) { setChats([data, ...chats]); selectChat(data); }
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keys?.[0]?.key_value,
          messages: [...messages, userMsg].slice(-10),
          model: AI_MODELS[0].id
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
      } else alert(data.error);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full relative font-sans">
      <header className="p-4 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black uppercase tracking-tighter">Чат-сессия</h2>
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 glass-card text-accent active:scale-90 transition-all"><Menu size={20} /></button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {AI_MODELS.map(m => (
            <div key={m.id} className="flex items-center gap-2.5 bg-accent/10 border border-accent/30 px-3 py-2 rounded-xl shadow-sm">
              <Cpu size={12} className="text-accent shrink-0" />
              <span className="text-[10px] font-bold text-white uppercase tracking-tight">{m.name}</span>
              <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
              <div className="flex items-center gap-1 text-yellow-400">
                <Sparkles size={10} fill="currentColor" />
                <span className="text-[10px] font-black tracking-tighter">{m.price}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
        {!currentChat ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <MessageSquare size={48} /><p className="text-sm">Выберите или создайте новый диалог</p>
            <button onClick={startNewChat} className="bg-accent px-8 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest">Новый чат</button>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-accent text-white rounded-tr-none shadow-lg shadow-accent/10' : 'glass-card border-white/10 rounded-tl-none text-gray-100 shadow-xl'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  code({node, inline, className, children, ...props}) {
                    return !inline ? (
                      <div className="relative my-2">
                        <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto text-[11px] font-mono border border-white/5">
                          {children}
                        </pre>
                        <button onClick={() => navigator.clipboard.writeText(children)} className="absolute top-2 right-2 p-1 bg-white/5 rounded hover:bg-white/10 transition-colors">
                           <Copy size={12} />
                        </button>
                      </div>
                    ) : (
                      <code className="bg-white/10 px-1 rounded font-mono text-accent" {...props}>{children}</code>
                    )
                  }
                }}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {loading && <div className="text-[10px] text-accent animate-pulse font-bold uppercase tracking-widest ml-1">ИИ анализирует...</div>}
        <div ref={scrollRef} />
      </div>

      {currentChat && (
        <div className="fixed bottom-24 left-0 w-full p-4 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 z-40">
          <div className="relative max-w-md mx-auto flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Напишите сообщение..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-accent/50 text-sm shadow-inner" />
            <button onClick={sendMessage} className="p-4 bg-accent rounded-2xl text-white active:scale-90 transition-all shadow-lg shadow-accent/20"><Send size={18} /></button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black/80 z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-4/5 bg-[#0a0a0a] z-[70] p-6 shadow-2xl border-l border-white/5">
              <div className="flex justify-between items-center mb-8"><h3 className="font-black uppercase tracking-widest text-xs">Архив диалогов</h3><X onClick={() => setIsHistoryOpen(false)} /></div>
              <button onClick={startNewChat} className="w-full py-4 glass-card border-dashed border-accent/40 text-accent font-black text-[10px] uppercase mb-6 flex items-center justify-center gap-2 tracking-widest"><Plus size={16} /> Создать диалог</button>
              <div className="space-y-3 overflow-y-auto max-h-[75vh] no-scrollbar">
                {chats.map(c => (
                  <div key={c.id} className={`flex items-center gap-2 p-3 rounded-xl ${currentChat?.id === c.id ? 'bg-accent/20 border border-accent/50 text-white' : 'bg-white/5 border border-transparent text-gray-400'}`}>
                    <div onClick={() => selectChat(c)} className="flex-1 text-[11px] font-bold truncate cursor-pointer uppercase tracking-tight">{c.title}</div>
                    <Trash2 onClick={() => deleteChat(c.id)} size={14} className="hover:text-red-500 transition-colors" />
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
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', tgId).order('created_at', { ascending: false });
    if (data) setKeys(data);
  };
  const createKey = async () => {
    const val = `nx_sk_${Math.random().toString(36).substring(2, 15)}`;
    const { data } = await supabase.from('api_keys').insert([{ user_id: tgId, key_name: `Ключ #${keys.length + 1}`, key_value: val }]).select();
    if (data) setKeys([...data, ...keys]);
  };

  return (
    <div className="p-6 space-y-6 pb-40 font-sans overflow-y-auto h-full no-scrollbar">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-black tracking-tighter uppercase">Разработчикам</h2><ShieldCheck className="text-green-500" /></div>
      
      <div className="glass-card p-5 border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-[0.2em] border-b border-white/5 pb-3">
          <BookOpen size={14} /> Полное руководство
        </div>
        <div className="space-y-4 text-[11px] text-gray-400 leading-relaxed">
          <div className="space-y-1">
            <span className="text-gray-100 font-bold block uppercase text-[9px] tracking-widest">Шаг 1: Конечная точка (Endpoint)</span>
            <p>Выполняйте все POST-запросы вашего приложения на этот защищенный адрес:</p>
            <code className="block bg-black/40 p-2.5 rounded-lg border border-white/5 text-accent text-[9px] whitespace-nowrap overflow-x-auto shadow-inner tracking-tight">https://{window.location.hostname}/api/chat</code>
          </div>
          <div className="space-y-1">
            <span className="text-gray-100 font-bold block uppercase text-[9px] tracking-widest">Шаг 2: Идентификация</span>
            <p>Создайте секретный ключ ниже. Его необходимо передавать в теле каждого запроса как обязательное поле <span className="text-white">"apiKey"</span>.</p>
          </div>
          <div className="space-y-1 pt-2">
            <span className="text-gray-100 font-bold block uppercase text-[9px] tracking-widest flex items-center gap-1"><Terminal size={10} /> Пример кода (cURL)</span>
            <pre className="bg-black p-4 rounded-xl text-[10px] text-green-500 overflow-x-auto border border-white/5 leading-snug font-mono shadow-2xl">
{`curl -X POST "${window.location.origin}/api/chat" \\
-H "Content-Type: application/json" \\
-d '{
  "apiKey": "ВАШ_API_КЛЮЧ",
  "prompt": "Привет!",
  "messages": []
}'`}
            </pre>
          </div>
        </div>
      </div>

      <button onClick={createKey} className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg">
        <Plus size={18} /> Сгенерировать новый ключ
      </button>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-1">Ваши активные ключи</h3>
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 border-white/5 flex flex-col space-y-2 hover:border-accent/20 transition-colors">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{k.key_name}</span>
            <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5 font-mono text-[10px] text-accent shadow-inner overflow-hidden">
              <span className="truncate mr-4 uppercase tracking-tighter">{k.key_value}</span>
              <Copy size={14} className="text-gray-500 hover:text-white cursor-pointer flex-shrink-0" onClick={() => { 
                navigator.clipboard.writeText(k.key_value); 
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                alert("Ключ скопирован!"); 
              }} />
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
      const { data: newUser } = await supabase.from('profiles').insert([{ telegram_id: tgUser.id, username: tgUser.username || 'user', stars_balance: 5.0 }]).select().single();
      setUserData(newUser);
    } else setUserData(data);
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready(); tg.expand();
      tg.headerColor = '#0a0a0a'; tg.backgroundColor = '#0a0a0a';
      const user = tg.initDataUnsafe?.user || { id: 12345, username: 'тестер' };
      syncUser(user);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#0a0a0a] text-white overflow-hidden font-sans select-none tracking-tight">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <ProfileView key="p" userData={userData} />}
          {activeTab === 'chat' && <ChatView key="c" userData={userData} onUpdateBalance={() => syncUser({ id: userData.telegram_id })} />}
          {activeTab === 'api' && <ApiView key="a" tgId={userData?.telegram_id} />}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-card p-2 flex justify-between items-center z-50 border-white/10 shadow-2xl backdrop-blur-xl bg-black/80">
        {[
          { id: 'home', icon: User, label: 'Профиль' },
          { id: 'chat', icon: MessageSquare, label: 'Чат' },
          { id: 'api', icon: Key, label: 'API' }
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); }} className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 ${activeTab === t.id ? 'bg-accent text-white shadow-lg shadow-accent/40 scale-105' : 'text-gray-500'}`}>
            <t.icon size={18} />
            <span className="text-[9px] mt-1 font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}