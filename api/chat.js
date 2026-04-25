import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jozhcryabkfdvfyjqmdd.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Конфигурация цен для моделей
const MODEL_CONFIG = {
  "nvidia/nemotron-3-nano-30b-a3b:free": 0.2,
  "minimax/minimax-m2.5:free": 0.8
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Используйте POST запрос' });

  const { apiKey, messages, model } = req.body;

  // Определение модели и её стоимости
  const selectedModel = model || "nvidia/nemotron-3-nano-30b-a3b:free";
  const cost = MODEL_CONFIG[selectedModel];

  if (cost === undefined) {
    return res.status(400).json({ error: `Модель '${selectedModel}' не поддерживается агрегатором.` });
  }

  try {
    // 1. Проверка API ключа агрегатора
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Ваш API ключ недействителен или не найден' });
    }

    // 2. Проверка профиля пользователя (баланс и статус бана)
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('stars_balance, is_banned')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Пользователь не найден в системе' });
    }

    // Проверка на БАН
    if (user.is_banned) {
      return res.status(403).json({ error: 'Ваш аккаунт заблокирован администратором' });
    }

    // Проверка баланса
    if (user.stars_balance < cost) {
      return res.status(402).json({ error: `Недостаточно звезд. Требуется: ${cost} ⭐` });
    }

    // 3. Запрос к провайдеру AllTokens
    const aiResponse = await fetch("https://api.alltokens.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_PROVIDER_KEY}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages,
        temperature: 0.7
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({ 
        error: aiData.error?.message || 'Ошибка на стороне нейросети' 
      });
    }

    // 4. Списание баланса согласно стоимости модели
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stars_balance: user.stars_balance - cost })
      .eq('telegram_id', keyData.user_id);

    if (updateError) {
      return res.status(500).json({ error: 'Ошибка при обновлении баланса' });
    }

    // 5. Возврат ответа
    res.status(200).json({ 
      reply: aiData.choices[0].message.content 
    });

  } catch (error) {
    res.status(500).json({ error: 'Критическая ошибка сервера: ' + error.message });
  }
}