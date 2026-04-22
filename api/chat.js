import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://jozhcryabkfdvfyjqmdd.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { apiKey, messages, model } = req.body; // Принимаем массив сообщений
  const COST = 0.2;

  try {
    const { data: keyData } = await supabase.from('api_keys').select('user_id').eq('key_value', apiKey).maybeSingle();
    if (!keyData) return res.status(401).json({ error: 'API ключ не найден' });

    const { data: user } = await supabase.from('profiles').select('stars_balance').eq('telegram_id', keyData.user_id).single();
    if (!user || user.stars_balance < COST) return res.status(402).json({ error: 'Пополните баланс' });

    // Запрос к AllTokens с передачей всей истории сообщений
    const aiResponse = await fetch("https://api.alltokens.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_PROVIDER_KEY}`
      },
      body: JSON.stringify({
        model: "alltokens/auto",
        messages: messages, // Передаем историю
        temperature: 0.7
      })
    });

    const aiData = await aiResponse.json();
    
    if (aiResponse.ok) {
      await supabase.from('profiles').update({ stars_balance: user.stars_balance - COST }).eq('telegram_id', keyData.user_id);
      res.status(200).json({ reply: aiData.choices[0].message.content });
    } else {
      res.status(500).json({ error: aiData.error?.message || 'Ошибка провайдера' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}