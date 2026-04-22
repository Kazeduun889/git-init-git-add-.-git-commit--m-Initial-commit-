import { createClient } from '@supabase/supabase-js'

// Инициализация Supabase на сервере
const supabase = createClient(
  process.env.https://jozhcryabkfdvfyjqmdd.supabase.co, 
  process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvemhjcnlhYmtmZHZmeWpxbWRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc5MTM1MywiZXhwIjoyMDkyMzY3MzUzfQ.ZaTC39PSm_iisUnzdLU_4JzB23UuO2iedtrOpMrTplk // Это секретный ключ, который мы добавим позже
)

export default async function handler(req, res) {
  // Разрешаем запросы только методом POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, prompt, model } = req.body;

  try {
    // 1. Проверяем, существует ли такой API ключ в нашей базе
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .single();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    // 2. Получаем баланс пользователя
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('stars_balance')
      .eq('telegram_id', keyData.user_id)
      .single();

    if (userData.stars_balance <= 0) {
      return res.status(402).json({ error: 'Insufficient balance' });
    }

    // 3. (Имитация) Если всё ок, возвращаем ответ
    // На следующем шаге здесь будет реальный запрос к Polza.ai или OpenRouter
    res.status(200).json({ 
      content: `[Server Response]: Вы использовали модель ${model}. Ваш баланс проверен.`,
      usage: 1 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}