import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://jozhcryabkfdvfyjqmdd.supabase.co", 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Используйте POST' });

  const { apiKey, prompt } = req.body;
  const COST = 0.2;

  try {
    // 1. Проверка вашего ключа в базе
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) return res.status(401).json({ error: 'Ключ агрегатора не найден' });

    // 2. Проверка баланса
    const { data: user } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (!user || user.stars_balance < COST) return res.status(402).json({ error: 'Недостаточно звезд' });

    // 3. Запрос к AllTokens (СТРОГО ПО ИНСТРУКЦИИ)
    const API_URL = "https://api.alltokens.ru/api/v1/chat/completions";
    
    const aiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_PROVIDER_KEY}`
      },
      body: JSON.stringify({
        "model": "alltokens/auto", // Тестовая модель из примера
        "messages": [
          {"role": "system", "content": "Отвечай кратко и по делу."},
          {"role": "user", "content": prompt}
        ]
      })
    });

    const rawText = await aiResponse.text();
    
    // Если всё еще 404 - выводим точный URL, который вызвал ошибку
    if (aiResponse.status === 404) {
      return res.status(404).json({ 
        error: `ОШИБКА 404. Сервер не нашел путь: ${API_URL}. Проверьте деплой!` 
      });
    }

    let aiData;
    try {
      aiData = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: `Бэкенд 1.8: Ошибка JSON. Текст: ${rawText.substring(0, 50)}` });
    }

    if (!aiResponse.ok) return res.status(aiResponse.status).json({ error: aiData.error?.message || 'Ошибка API' });

    // 4. Списание баланса
    await supabase.from('profiles').update({ stars_balance: user.stars_balance - COST }).eq('telegram_id', keyData.user_id);

    // 5. Ответ
    res.status(200).json({ reply: aiData.choices[0].message.content });

  } catch (error) {
    res.status(500).json({ error: 'Критическая ошибка v1.8: ' + error.message });
  }
}