import React, { useState, useEffect } from 'react';
import { User, LayoutGrid, Key, Sparkles } from 'lucide-react';
import { Copy, Plus, Trash2, ShieldCheck, Key as KeyIcon } from 'lucide-react';

// Импортируем будущие компоненты (пока создадим их внутри)
const ProfileView = () => {
  const [stars, setStars] = useState(500);

  // Список тарифов (пакеты звезд)
  const PACKS = [
    { amount: 50, price: 'бесплатно (тест)', icon: '🥉' },
    { amount: 250, price: '150₽', icon: '🥈' },
    { amount: 1000, price: '500₽', icon: '🥇' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      {/* Карточка профиля */}
      <div className="glass-card p-6 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-accent to-purple-400 rounded-2xl flex items-center justify-center shadow-xl">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold italic">User_777</h2>
            <div className="flex items-center gap-1 text-yellow-400">
              <Sparkles size={14} fill="currentColor" />
              <span className="text-sm font-bold">{stars} Stars</span>
            </div>
          </div>
        </div>

        {/* Мини-статистика */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Запросов</p>
            <p className="text-lg font-mono">1,240</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-400 uppercase font-bold">API Ключей</p>
            <p className="text-lg font-mono">2</p>
          </div>
        </div>
      </div>

      {/* Пополнение баланса */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Пополнить баланс</h3>
        <div className="grid gap-3">
          {PACKS.map((pack) => (
            <button 
              key={pack.amount}
              className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all active:scale-[0.98] border-white/5 hover:border-accent/30"
              onClick={() => setStars(stars + pack.amount)} // Пока просто имитируем
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pack.icon}</span>
                <div className="text-left">
                  <p className="font-bold">{pack.amount} Stars</p>
                  <p className="text-[10px] text-gray-400">{pack.price}</p>
                </div>
              </div>
              <Plus size={18} className="text-accent" />
            </button>
          ))}
        </div>
      </div>
      
      <p className="text-[10px] text-center text-gray-500">
        1 Star ≈ 1 запрос к GPT-4o Mini. Расход зависит от модели.
      </p>
    </div>
  );
};

// Данные моделей (позже вынесем в отдельный файл или API)
const AI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', type: 'Chat', price: 'Cheap', icon: '⚡' },
  { id: 'claude-3-haiku', name: 'Claude Haiku', provider: 'Anthropic', type: 'Chat', price: 'Cheap', icon: '🎨' },
  { id: 'gemini-flash', name: 'Gemini 1.5 Flash', provider: 'Google', type: 'Fast', price: 'Free-ish', icon: '💎' },
  { id: 'llama-3-8b', name: 'Llama 3.1 8B', provider: 'Meta', type: 'Open', price: 'Cheap', icon: '🦙' },
];

const ModelsView = () => (
  <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-2xl font-bold">Нейросети</h2>
        <p className="text-gray-400 text-sm">Выберите подходящую модель</p>
      </div>
      <div className="bg-accent/20 text-accent text-xs px-3 py-1 rounded-full border border-accent/30 font-medium">
        {AI_MODELS.length} Доступно
      </div>
    </div>

    <div className="grid gap-4">
      {AI_MODELS.map((model) => (
        <div key={model.id} className="glass-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10 group-hover:border-accent/50 transition-colors">
              {model.icon}
            </div>
            <div>
              <h3 className="font-bold text-white tracking-wide">{model.name}</h3>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase font-bold tracking-wider italic">
                  {model.provider}
                </span>
                <span className="text-[10px] text-green-400 font-medium">
                   ● {model.price}
                </span>
              </div>
            </div>
          </div>
          
          <button className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-accent transition-all">
            <Sparkles size={18} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const ApiView = () => {
  const [keys, setKeys] = useState([
    { id: 1, name: 'Main Project', key: 'nx_sk_...4a2b', created: '12.05.2024' }
  ]);

  const generateKey = () => {
    const newKey = {
      id: Date.now(),
      name: `Key #${keys.length + 1}`,
      key: `nx_sk_${Math.random().toString(36).substring(7)}`,
      created: new Date().toLocaleDateString()
    };
    setKeys([newKey, ...keys]);
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">API Доступ</h2>
        <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
          <ShieldCheck size={20} />
        </div>
      </div>

      {/* Кнопка создания */}
      <button 
        onClick={generateKey}
        className="w-full glass-card border-dashed border-accent/40 p-4 flex items-center justify-center gap-2 text-accent hover:bg-accent/5 transition-all group"
      >
        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
        <span className="font-semibold">Создать новый API ключ</span>
      </button>

      {/* Список ключей */}
      <div className="space-y-4">
        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest px-1">Ваши активные ключи</p>
        
        {keys.map((k) => (
          <div key={k.id} className="glass-card p-4 space-y-3 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm">{k.name}</h4>
                <p className="text-[10px] text-gray-500">{k.created}</p>
              </div>
              <button className="text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2 border border-white/5">
              <code className="text-xs text-accent font-mono">{k.key}</code>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Copy size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Инфо-блок */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <h4 className="text-blue-400 text-sm font-bold mb-1 flex items-center gap-2">
          <KeyIcon size={14} /> Base URL
        </h4>
        <code className="text-[10px] text-gray-300 break-all">
          https://api.your-aggregator.com/v1
        </code>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.backgroundColor = '#0f172a';
    }
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      {/* Основной контент */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'home' && <ProfileView />}
        {activeTab === 'models' && <ModelsView />}
        {activeTab === 'api' && <ApiView />}
      </main>

      {/* Нижняя навигация */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-card p-2 flex justify-between items-center z-50 shadow-2xl">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'home' ? 'bg-accent text-white shadow-lg' : 'text-gray-400'}`}
        >
          <User size={20} />
          <span className="text-[10px] mt-1 font-medium">Профиль</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('models')}
          className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'models' ? 'bg-accent text-white shadow-lg' : 'text-gray-400'}`}
        >
          <LayoutGrid size={20} />
          <span className="text-[10px] mt-1 font-medium">Модели</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('api')}
          className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'api' ? 'bg-accent text-white shadow-lg' : 'text-gray-400'}`}
        >
          <Key size={20} />
          <span className="text-[10px] mt-1 font-medium">API</span>
        </button>
      </nav>
    </div>
  );
}

export default App;