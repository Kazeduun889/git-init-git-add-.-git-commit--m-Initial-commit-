import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Используйте POST' });

  const { apiKey, prompt } = req.body;
  const COST = 0.2;

  try {
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) return res.status(401).json({ error: 'Ключ не найден' });

    const { data: user } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (!user || user.stars_balance < COST) return res.status(402).json({ error: 'Нет звезд' });

    // ВНИМАНИЕ: Ссылка ниже в точности как на твоем скриншоте
    const API_URL = "https://api.alltokens.ru/api/v1/chat/completions";

    const aiResponse = await fetch(API_URL, {
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

    if (aiResponse.status === 404) {
      return res.status(404).json({ 
        error: `ОШИБКА 404. Сервер не видит эндпоинт. Проверьте деплой! URL: ${API_URL}` 
      });
    }

    const rawText = await aiResponse.text();
    const aiData = JSON.parse(rawText);

    if (!aiResponse.ok) return res.status(aiResponse.status).json({ error: aiData.error?.message || 'Ошибка API' });

    await supabase.from('profiles').update({ stars_balance: user.stars_balance - COST }).eq('telegram_id', keyData.user_id);

    res.status(200).json({ reply: aiData.choices[0].message.content });

  } catch (error) {
    res.status(500).json({ error: 'Критическая ошибка v1.7: ' + error.message });
  }
}