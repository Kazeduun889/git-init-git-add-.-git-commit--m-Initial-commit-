import { createClient } from '@supabase/supabase-js'

// Инициализация Supabase с серверными ключами
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  const { apiKey, prompt } = req.body;
  const COST = 0.2; // Стоимость одного запроса

  try {
    // 1. Проверяем API ключ пользователя в нашей базе
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .single();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Неверный API ключ агрегатора' });
    }

    // 2. Проверяем баланс пользователя
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (userError || !userData || userData.stars_balance < COST) {
      return res.status(402).json({ error: 'Недостаточно звезд на балансе' });
    }

    // 3. Запрос к API AllTokens
    const aiResponse = await fetch("https://api.alltokens.ru/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_PROVIDER_KEY}` // Ваш ключ от alltokens.ru в Vercel
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const aiData = await aiResponse.json();

    if (aiData.error) {
      return res.status(500).json({ error: 'Ошибка провайдера: ' + aiData.error.message });
    }

    // 4. Если ответ получен успешно, списываем 0.2 звезды
    const newBalance = userData.stars_balance - COST;
    await supabase
      .from('profiles')
      .update({ stars_balance: newBalance })
      .eq('telegram_id', keyData.user_id);

    // 5. Возвращаем ответ пользователю
    res.status(200).json({ 
      reply: aiData.choices[0].message.content 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}