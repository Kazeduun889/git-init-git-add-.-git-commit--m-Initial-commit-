import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { apiKey, prompt } = req.body;
  const COST = 0.2;

  try {
    // 1. Проверка ключа в базе
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Ваш API ключ не найден в базе' });
    }

    // 2. Проверка баланса
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (userError || !user || user.stars_balance < COST) {
      return res.status(402).json({ error: 'Недостаточно звезд (нужно 0.2)' });
    }

    // 3. Запрос к AllTokens
    const aiResponse = await fetch("https://api.alltokens.ru/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_PROVIDER_KEY}`
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const aiData = await aiResponse.json();

    // Проверка ответа от провайдера
    if (!aiResponse.ok) {
      return res.status(500).json({ error: 'Ошибка AllTokens: ' + (aiData.error?.message || 'Неизвестно') });
    }

    // 4. Списание
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stars_balance: user.stars_balance - COST })
      .eq('telegram_id', keyData.user_id);

    if (updateError) {
      return res.status(500).json({ error: 'Ошибка списания баланса. Проверьте тип колонки в SQL!' });
    }

    res.status(200).json({ reply: aiData.choices[0].message.content });

  } catch (error) {
    res.status(500).json({ error: 'Критическая ошибка: ' + error.message });
  }
}