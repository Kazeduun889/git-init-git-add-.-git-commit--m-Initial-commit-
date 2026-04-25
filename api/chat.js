
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jozhcryabkfdvfyjqmdd.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- БЕЛЫЙ СПИСОК РАЗРЕШЕННЫХ МОДЕЛЕЙ ---
const ALLOWED_MODELS = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "alltokens/auto" // Можно оставить эту, если хочешь доверять авто-выбору AllTokens
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Используйте POST запрос' });

  const { apiKey, messages, model } = req.body;
  const COST = 0.2;

  // 1. ПРОВЕРКА МОДЕЛИ НА ВШИВОСТЬ
  // Если модель не прислана или её нет в нашем белом списке - блокируем запрос
  if (!model || !ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ 
      error: `Модель '${model}' не поддерживается вашим тарифом. Доступные модели: ${ALLOWED_MODELS.join(', ')}` 
    });
  }

  try {
    // 2. Валидация ключа агрегатора
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Ваш API ключ недействителен' });
    }

    // 3. Проверка баланса
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (userError || !user || user.stars_balance < COST) {
      return res.status(402).json({ error: 'Недостаточно звезд на балансе' });
    }

    // 4. Запрос к AllTokens (только если модель прошла проверку выше)
    const aiResponse = await fetch("https://api.alltokens.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_PROVIDER_KEY}`
      },
      body: JSON.stringify({
        model: model, // Здесь будет только разрешенная модель
        messages: messages,
        temperature: 0.7
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({ error: aiData.error?.message || 'Ошибка нейросети' });
    }

    // 5. Списание средств
    await supabase.from('profiles').update({ stars_balance: user.stars_balance - COST }).eq('telegram_id', keyData.user_id);

    res.status(200).json({ reply: aiData.choices[0].message.content });

  } catch (error) {
    res.status(500).json({ error: 'Системная ошибка: ' + error.message });
  }
}