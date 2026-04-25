import React, { useState, useEffect, useRef } from 'react';
import { User, Key, Sparkles, Copy, Plus, Trash2, ShieldCheck, Send, Loader2, Menu, X, MessageSquare, BookOpen, Terminal, Cpu, BarChart3, Search, Wrench, Activity, Clock, Globe, Info, Code as CodeIcon, Ban, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from './supabaseClient';

const ADMIN_ID = 1562788488;

const AI_MODELS = [
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano 30B', provider: 'NVIDIA', price: '0.2', icon: '🤖' },
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', provider: 'MiniMax', price: '0.8', icon: '🚀' },
];

const RECHARGE_PACKS = [
  { amt: 10 }, { amt: 25 }, { amt: 50 }, { amt: 100 }, 
  { amt: 150 }, { amt: 250 }, { amt: 350 }, { amt: 500 }
];

// --- Вкладка Админа ---
const AdminView = ({ onBack }) => {
  const [stats, setStats] = useState({ users: 0, stars: 0, keys: 0, newToday: 0 });
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAdminData(); }, []);

  const loadAdminData = async () => {
    setLoading(true);
    const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: keys } = await supabase.from('api_keys').select('id');
    
    if (profs) {
      const today = new Date().toISOString().split('T')[0];
      setUsers(profs);
      setStats({
        users: profs.length,
        stars: profs.reduce((acc, curr) => acc + (curr.stars_balance || 0), 0),
        keys: keys?.length || 0,
        newToday: profs.filter(u => u.created_at?.startsWith(today)).length
      });
    }
    setLoading(false);
  };

  const updateBalance = async (user, offset) => {
    const action = offset > 0 ? 'начислить' : 'списать';
    if (!window.confirm(`Вы уверены, что хотите ${action} ${Math.abs(offset)} звезд пользователю @${user.username}?`)) return;
    
    const { error } = await supabase.from('profiles').update({ stars_balance: user.stars_balance + offset }).eq('telegram_id', user.telegram_id);
    if (!error) loadAdminData();
  };

  const toggleBan = async (user) => {
    const action = user.is_banned ? 'разблокировать' : 'ЗАБАНИТЬ';
    if (!window.confirm(`Вы уверены, что хотите ${action} пользователя @${user.username}?`)) return;

    const { error } = await supabase.from('profiles').update({ is_banned: !user.is_banned }).eq('telegram_id', user.telegram_id);
    if (!error) loadAdminData();
  };

  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) || u.telegram_id.toString().includes(search));

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-6 space-y-6 pb-40 font-sans h-full overflow-y-auto no-scrollbar bg-[#0a0a0a]">
      <div className="flex items-center justify-between sticky top-0 bg-[#0a0a0a] py-2 z-10">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-red-500" />
          <h2 className="text-xl font-black uppercase tracking-tighter text-white">Управление</h2>
        </div>
        <button onClick={onBack} className="p-2 glass-card text-gray-500"><X size={20}/></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 border-red-500/10 bg-red-500/5 text-white">
          <span className="text-[9px] uppercase font-black text-gray-500 block mb-1">Всего юзеров</span>
          <div className="text-2xl font-black">{stats.users}</div>
          <div className="text-[9px] text-green-500 mt-1 flex items-center gap-1 font-bold font-sans">+{stats.newToday} сегодня</div>
        </div>
        <div className="glass-card p-4 border-accent/10 bg-accent/5 text-white">
          <span className="text-[9px] uppercase font-black text-gray-500 block mb-1">Звезд в обороте</span>
          <div className="text-2xl font-black">{stats.stars.toFixed(0)}</div>
          <div className="text-[9px] text-accent mt-1 font-bold font-sans">AVG: {(stats.stars / (stats.users || 1)).toFixed(1)}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-gray-600" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по ID или нику..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-10 text-sm focus:outline-none focus:border-red-500/30 text-white font-sans" />
      </div>

      <div className="space-y-3">
        {loading ? <Loader2 className="animate-spin mx-auto text-accent mt-10" /> : filteredUsers.map(u => (
          <div key={u.telegram_id} className={`glass-card p-4 border-white/5 bg-white/[0.02] ${u.is_banned ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-col">
                <span className={`font-bold text-sm ${u.is_banned ? 'text-red-500' : 'text-white'}`}>@{u.username || 'unknown'} {u.is_banned && '(BANNED)'}</span>
                <span className="text-[9px] text-gray-500 font-mono tracking-tighter">{u.telegram_id}</span>
              </div>
              <div className="bg-yellow-500/10 px-3 py-1 rounded-full text-yellow-500 font-black text-[11px] border border-yellow-500/20 font-sans">
                {u.stars_balance?.toFixed(1)} ⭐
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateBalance(u, 10)} className="flex-1 bg-white/5 text-white py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border border-white/5">+10</button>
              <button onClick={() => updateBalance(u, 50)} className="flex-1 bg-white/5 text-white py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border border-white/5">+50</button>
              <button onClick={() => toggleBan(u)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${u.is_banned ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                {u.is_banned ? <div className="flex items-center justify-center gap-1"><UserCheck size={10}/> UNBAN</div> : <div className="flex items-center justify-center gap-1"><Ban size={10}/> BAN</div>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// --- Вкладка Профиль ---
const ProfileView = ({ userData, onOpenAdmin }) => {
  const [isPaying, setIsPaying] = useState(false);
  const isAdmin = userData?.telegram_id === ADMIN_ID;

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
          if (status === 'paid') alert('Звезды успешно зачислены!');
          setIsPaying(false);
        });
      } else { alert("Ошибка: " + data.error); setIsPaying(false); }
    } catch (e) { alert("Ошибка сети: " + e.message); setIsPaying(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 pb-32 font-sans text-white">
      <div className="glass-card p-6 border-accent/10 bg-accent/[0.02] relative text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-accent to-purple-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-accent/20 mb-4 border border-white/10">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">@{userData?.username || 'user'}</h2>
          <div className="flex items-center gap-1.5 text-yellow-400 mt-2 font-black bg-black/40 px-5 py-2 rounded-full border border-white/5 shadow-inner">
            <Sparkles size={16} fill="currentColor" />
            <span className="text-[15px]">{userData?.stars_balance?.toFixed(1) ?? 0} Звезд</span>
          </div>
          
          {isAdmin && (
            <button onClick={onOpenAdmin} className="mt-5 flex items-center gap-2 bg-red-500/10 text-red-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all shadow-lg">
              <Wrench size={13}/> Управление
            </button>
          )}
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-1 font-mono">Выбор пакета звезд</h3>
        <div className="grid grid-cols-2 gap-3">
          {RECHARGE_PACKS.map(pack => (
            <button key={pack.amt} onClick={() => handlePayment(pack.amt)} className="glass-card p-4 flex flex-col items-center justify-center gap-2 border-white/5 active:scale-95 transition-all hover:border-accent/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] bg-white/[0.01]">
              <Sparkles size={20} className="text-yellow-500" fill="currentColor" />
              <span className="font-black text-white text-sm">{pack.amt} Звезд</span>
              <div className="h-[1px] w-8 bg-white/10 my-1" />
              <span className="text-[9px] text-accent font-black uppercase tracking-tighter">Пополнить</span>
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
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const scrollRef = useRef(null);

  useEffect(() => { if (userData) loadChats(); }, [userData]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('user_id', userData.telegram_id).order('created_at', { ascending: false });
    if (data) setChats(data);
  };

  const startNewChat = async () => {
    if (chats.length >= 10) return alert("Лимит 10 чатов.");
    const { data } = await supabase.from('chats').insert([{ user_id: userData.telegram_id, title: `Сессия #${chats.length + 1}` }]).select().single();
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
      } else alert(data.error);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full relative font-sans overflow-hidden">
      <header className="p-4 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black uppercase tracking-tighter text-white">Чат</h2>
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 glass-card text-accent active:scale-90 transition-all border-accent/20"><Menu size={20} /></button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {AI_MODELS.map(m => (
            <button key={m.id} onClick={() => setSelectedModel(m)} className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all border ${selectedModel.id === m.id ? 'bg-accent/10 border-accent/30 shadow-lg' : 'bg-white/5 border-transparent'}`}>
              <Cpu size={12} className={selectedModel.id === m.id ? 'text-accent' : 'text-gray-500'} />
              <span className={`text-[10px] font-black uppercase tracking-tighter ${selectedModel.id === m.id ? 'text-white' : 'text-gray-500'}`}>{m.name}</span>
              <div className="w-[1px] h-3 bg-white/10" />
              <div className="flex items-center gap-1 text-yellow-400">
                <Sparkles size={11} fill="currentColor" />
                <span className="text-[11px] font-black tracking-tighter">{m.price}</span>
              </div>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-56 scroll-smooth text-white">
        {!currentChat ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 font-sans">
            <MessageSquare size={54} className="text-accent" /><p className="text-sm font-medium">Создайте новый диалог для начала работы</p>
            <button onClick={startNewChat} className="bg-accent px-10 py-3.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-accent/20 active:scale-95 transition-all">Новый чат</button>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] p-4 rounded-[22px] text-[14px] leading-relaxed break-words overflow-wrap-anywhere font-sans ${m.role === 'user' ? 'bg-accent text-white rounded-tr-none shadow-lg' : 'glass-card border-white/10 rounded-tl-none text-gray-100 shadow-xl'}`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  components={{
                    table: ({children}) => <div className="overflow-x-auto my-3 rounded-lg border border-white/5"><table className="min-w-full divide-y divide-white/5">{children}</table></div>,
                    thead: ({children}) => <thead className="bg-white/5">{children}</thead>,
                    th: ({children}) => <th className="px-3 py-2 text-left text-[11px] font-black uppercase text-gray-400 font-sans">{children}</th>,
                    td: ({children}) => <td className="px-3 py-2 text-[12px] border-t border-white/5 font-sans">{children}</td>,
                    code({node, inline, className, children, ...props}) {
                      return !inline ? (
                        <div className="relative my-3 w-full max-w-full overflow-hidden font-sans">
                          <pre className="bg-black/60 p-4 rounded-xl overflow-x-auto text-[12px] font-mono border border-white/5 no-scrollbar">
                            {children}
                          </pre>
                          <button onClick={() => { navigator.clipboard.writeText(children); window.Telegram.WebApp.HapticFeedback.impactOccurred('medium'); }} className="absolute top-3 right-3 p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5">
                             <Copy size={13} className="text-gray-400" />
                          </button>
                        </div>
                      ) : <code className="bg-white/10 px-1.5 py-0.5 rounded-md font-mono text-accent text-[12px]" {...props}>{children}</code>
                    }
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {loading && <div className="flex items-center gap-2 text-[10px] text-accent animate-pulse font-black uppercase tracking-[0.2em] ml-1 font-sans"><Loader2 size={12} className="animate-spin" /> Генерация ответа...</div>}
        <div ref={scrollRef} />
      </div>

      {currentChat && (
        <div className="fixed bottom-24 left-0 w-full p-4 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 z-40">
          <div className="relative max-w-md mx-auto flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Напишите сообщение..." className="flex-1 bg-white/5 border border-white/10 rounded-[20px] py-4 px-6 focus:outline-none focus:border-accent/40 text-[14px] text-white shadow-inner font-sans" />
            <button onClick={sendMessage} className="p-4 bg-accent rounded-[20px] text-white active:scale-90 transition-all shadow-xl shadow-accent/20"><Send size={18} /></button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black/80 z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-4/5 bg-[#0a0a0a] z-[70] p-6 shadow-2xl border-l border-white/5">
              <div className="flex justify-between items-center mb-8 text-white font-sans"><h3 className="font-black uppercase tracking-widest text-[11px] text-gray-400">Архив переписки</h3><X onClick={() => setIsHistoryOpen(false)} className="text-gray-500 cursor-pointer" /></div>
              <button onClick={startNewChat} className="w-full py-4 glass-card border-dashed border-accent/40 text-accent font-black text-[10px] uppercase mb-6 flex items-center justify-center gap-3 tracking-widest active:scale-95 transition-all font-sans"><Plus size={16} /> Создать диалог</button>
              <div className="space-y-3 overflow-y-auto max-h-[75vh] no-scrollbar">
                {chats.map(c => (
                  <div key={c.id} className={`flex items-center gap-2 p-4 rounded-2xl transition-all ${currentChat?.id === c.id ? 'bg-accent/15 border border-accent/40 text-white shadow-lg shadow-accent/5' : 'bg-white/[0.02] border border-transparent text-gray-500 font-sans'}`}>
                    <div onClick={() => selectChat(c)} className="flex-1 text-[11px] font-black truncate cursor-pointer uppercase tracking-tight">{c.title}</div>
                    <Trash2 onClick={() => deleteChat(c.id)} size={15} className="hover:text-red-500 transition-colors opacity-60 hover:opacity-100" />
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
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  
  useEffect(() => { if (tgId) fetchKeys(); }, [tgId]);
  const fetchKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', tgId).order('created_at', { ascending: false });
    if (data) setKeys(data);
  };
  const createKey = async () => {
    const val = `nx_sk_${Math.random().toString(36).substring(2, 15)}`;
    const { data, error } = await supabase.from('api_keys').insert([{ user_id: tgId, key_name: `Токен #${keys.length + 1}`, key_value: val }]).select();
    if (data) setKeys([...data, ...keys]);
  };

  return (
    <div className="p-6 space-y-6 pb-40 font-sans overflow-y-auto h-full no-scrollbar text-white">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-black tracking-tighter uppercase font-sans">API Раздел</h2><ShieldCheck className="text-green-500" /></div>
      
      <button 
        onClick={() => setIsDocsOpen(true)}
        className="w-full glass-card p-5 flex items-center justify-between border-accent/20 bg-accent/5 active:scale-[0.98] transition-all group font-sans"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-lg text-white"><BookOpen size={18} /></div>
          <div className="text-left font-sans">
            <span className="block text-[11px] font-black uppercase text-white">Инструкция внедрения</span>
            <span className="text-[9px] text-gray-400 font-medium font-sans italic">Как использовать наш API у себя</span>
          </div>
        </div>
        <Plus size={16} className="text-accent group-hover:rotate-45 transition-transform" />
      </button>

      <button onClick={createKey} className="w-full glass-card border-dashed border-accent/40 p-5 flex items-center justify-center gap-3 text-accent font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-accent/5 font-sans">
        <Plus size={18} /> Сгенерировать API Токен
      </button>

      <div className="space-y-3 font-sans">
        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-1 font-sans">Ваши активные токены</h3>
        {keys.map(k => (
          <div key={k.id} className="glass-card p-4 border-white/5 flex flex-col space-y-2 hover:border-accent/20 transition-all font-sans text-white">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-sans">{k.key_name}</span>
            <div className="flex items-center justify-between bg-black/40 rounded-xl px-4 py-3 border border-white/5 font-mono text-[10px] text-accent shadow-inner overflow-hidden">
              <span className="truncate mr-4 uppercase tracking-tighter">{k.key_value}</span>
              <Copy size={14} className="text-gray-500 hover:text-white cursor-pointer flex-shrink-0" onClick={() => { navigator.clipboard.writeText(k.key_value); alert("Токен скопирован!"); }} />
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isDocsOpen && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[100] bg-[#0a0a0a] p-6 overflow-y-auto no-scrollbar font-sans text-white">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#0a0a0a] py-2 z-20 font-sans">
              <div className="flex items-center gap-2 font-sans">
                <Globe size={18} className="text-accent" />
                <h3 className="font-black uppercase tracking-widest text-xs font-sans">Руководство по интеграции</h3>
              </div>
              <button onClick={() => setIsDocsOpen(false)} className="p-2 glass-card text-gray-500"><X size={20}/></button>
            </div>

            <div className="space-y-8 text-gray-300 pb-20 font-sans">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-sans">
                  <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center text-[10px] font-bold text-accent font-sans">01</div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest font-sans">Обзор агрегатора</h4>
                </div>
                <p className="text-[12px] leading-relaxed text-gray-400 font-sans">
                  Наш сервис предоставляет единый, совместимый с OpenAI стандарт API для доступа к передовым языковым моделям. Вы можете подключить наш интеллект к своим ботам, сайтам или софту, используя персональный баланс звезд.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-sans">
                  <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center text-[10px] font-bold text-accent font-sans">02</div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest font-sans">Точка доступа (Endpoint)</h4>
                </div>
                <p className="text-[12px] leading-relaxed text-gray-400 font-sans">Выполняйте POST-запросы на указанный адрес. Метод передачи данных — JSON.</p>
                <div className="flex items-center gap-2 bg-black/50 p-4 rounded-xl border border-white/5 font-sans">
                  <code className="flex-1 text-accent text-[10px] font-bold overflow-hidden truncate font-mono">https://{window.location.hostname}/api/chat</code>
                  <Copy size={12} className="cursor-pointer hover:text-white" onClick={() => { navigator.clipboard.writeText(`https://${window.location.hostname}/api/chat`); alert("URL скопирован!"); }} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-sans">
                  <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center text-[10px] font-bold text-accent font-sans">03</div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest font-sans">Параметры авторизации</h4>
                </div>
                <p className="text-[12px] leading-relaxed text-gray-400 font-sans">
                  Обязательно передавайте поле <span className="text-white font-bold font-sans">"apiKey"</span> внутри JSON-тела. Это ваш уникальный токен, через который происходит списание звезд с вашего счета.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-sans">
                  <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center text-[10px] font-bold text-accent font-sans">04</div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest font-sans">Поддерживаемые модели</h4>
                </div>
                <div className="glass-card p-4 border-white/5 space-y-3 bg-white/[0.01] font-sans">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 font-sans">
                    <span className="text-[10px] font-bold text-white uppercase font-sans">Имя (ID) для API</span>
                    <span className="text-[10px] font-bold text-white uppercase font-sans">Цена</span>
                  </div>
                  {AI_MODELS.map(m => (
                    <div key={m.id} className="flex justify-between items-center font-sans">
                      <code className="text-accent text-[10px] font-bold font-mono">{m.id}</code>
                      <span className="text-[10px] text-gray-400 font-black font-sans">{m.price} ⭐</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-sans">
                  <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center text-[10px] font-bold text-accent font-sans">05</div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest font-sans">Пример кода (Python)</h4>
                </div>
                <pre className="bg-black/80 p-4 rounded-xl text-[10px] text-green-500/90 overflow-x-auto border border-white/10 leading-snug font-mono shadow-inner">
{`import requests

url = "https://${window.location.hostname}/api/chat"
headers = {"Content-Type": "application/json"}
data = {
    "apiKey": "ВАШ_ТОКЕН",
    "prompt": "Напиши код на Python",
    "model": "nvidia/nemotron-3-nano-30b-a3b:free",
    "messages": [] # Контекст диалога
}

response = requests.post(url, headers=headers, json=data)
print(response.json()['reply'])`}
                </pre>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
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

  if (userData?.is_banned) {
    return (
      <div className="flex flex-col h-screen bg-[#0a0a0a] items-center justify-center p-8 text-center font-sans">
        <Ban size={64} className="text-red-500 mb-6 animate-pulse" />
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Доступ ограничен</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Вы забанены, возможно, через некоторое время вас разблокирует администратор.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#0a0a0a] text-white overflow-hidden font-sans select-none tracking-tight">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isAdminMode ? (
            <AdminView key="admin" onBack={() => setIsAdminMode(false)} />
          ) : (
            <>
              {activeTab === 'home' && <ProfileView key="p" userData={userData} onOpenAdmin={() => setIsAdminMode(true)} />}
              {activeTab === 'chat' && <ChatView key="c" userData={userData} onUpdateBalance={() => syncUser({ id: userData.telegram_id })} />}
              {activeTab === 'api' && <ApiView key="a" tgId={userData?.telegram_id} />}
            </>
          )}
        </AnimatePresence>
      </main>

      {!isAdminMode && (
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
      )}
    </div>
  );
}