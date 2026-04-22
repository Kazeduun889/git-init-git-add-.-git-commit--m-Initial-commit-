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
    // 1. Проверка ключа в базе
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Ваш API ключ агрегатора не найден' });
    }

    // 2. Проверка баланса
    const { data: user } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (!user || user.stars_balance < COST) {
      return res.status(402).json({ error: 'Недостаточно звезд на балансе' });
    }

    // 3. Запрос к AllTokens (Пробуем другой эндпоинт)
    // Убедитесь, что модель в кавычках написана именно так, как требует alltokens
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

    const rawText = await aiResponse.text();
    
    // Если статус 404, значит URL всё еще неверный
    if (aiResponse.status === 404) {
      return res.status(404).json({ 
        error: `Провайдер вернул 404. Проверьте URL. Текущий эндпоинт: https://api.alltokens.ru/v1/chat/completions` 
      });
    }

    let aiData;
    try {
      aiData = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: `Ошибка парсинга JSON: ${rawText.substring(0, 50)}` });
    }

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({ error: aiData.error?.message || 'Ошибка провайдера' });
    }

    // 4. Списание баланса
    await supabase
      .from('profiles')
      .update({ stars_balance: user.stars_balance - COST })
      .eq('telegram_id', keyData.user_id);

    res.status(200).json({ reply: aiData.choices[0].message.content });

  } catch (error) {
    res.status(500).json({ error: 'Критическая ошибка: ' + error.message });
  }
}