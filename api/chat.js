https://jozhcryabkfdvfyjqmdd.supabase.co
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://jozhcryabkfdvfyjqmdd.supabase.co", 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Используйте POST запрос' });

  const { apiKey, messages, model } = req.body;
  const COST = 0.2; // Фиксированная стоимость запроса

  try {
    // 1. Валидация ключа агрегатора
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Ваш API ключ недействителен или не найден' });
    }

    // 2. Проверка баланса пользователя
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (userError || !user || user.stars_balance < COST) {
      return res.status(402).json({ error: 'Недостаточно звезд. Требуется минимум 0.2 ⭐' });
    }

    // 3. Запрос к провайдеру (alltokens.ru)
    const aiResponse = await fetch("https://api.alltokens.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_PROVIDER_KEY}`
      },
      body: JSON.stringify({
        model: model || "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: messages, // Передача истории диалога
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({ 
        error: aiData.error?.message || 'Ошибка на стороне нейросети' 
      });
    }

    // 4. Списание средств с баланса (атомарное обновление)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stars_balance: user.stars_balance - COST })
      .eq('telegram_id', keyData.user_id);

    if (updateError) {
      return res.status(500).json({ error: 'Системная ошибка при списании баланса' });
    }

    // 5. Успешный возврат ответа
    res.status(200).json({ 
      reply: aiData.choices[0].message.content 
    });

  } catch (error) {
    res.status(500).json({ error: 'Критическая ошибка сервера: ' + error.message });
  }
}