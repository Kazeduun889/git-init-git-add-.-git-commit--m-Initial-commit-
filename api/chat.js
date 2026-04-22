import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Проверяем наличие ключей (чтобы сервер не падал)
  const supabaseUrl = 'https://jozhcryabkfdvfyjqmdd.supabase.co';
  const supabaseKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvemhjcnlhYmtmZHZmeWpxbWRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc5MTM1MywiZXhwIjoyMDkyMzY3MzUzfQ.ZaTC39PSm_iisUnzdLU_4JzB23UuO2iedtrOpMrTplk;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing environment variables on server' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Please use POST request' });
  }

  const { apiKey, prompt, model } = req.body || {};

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }

  try {
    // Проверка ключа в базе
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .maybeSingle();

    if (keyError || !keyData) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    res.status(200).json({ 
      content: `Hello! I am your AI. Server is working. Model: ${model || 'default'}`,
      status: 'success'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}