import { createClient } from '@supabase/supabase-js'

// 1. Вставь свой URL в одинарных кавычках здесь:
const supabaseUrl = 'https://jozhcryabkfdvfyjqmdd.supabase.co'; 

// 2. Ключ НЕ ВСТАВЛЯЙ сюда текстом. Оставь так, как написано ниже.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Please use POST request' });
  }

  const { apiKey, prompt, model } = req.body || {};

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is missing' });
  }

  try {
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    res.status(200).json({ 
      content: `Бэкенд работает! Модель: ${model || 'не выбрана'}`,
      status: 'success'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}