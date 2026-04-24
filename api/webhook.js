import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const update = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  try {
    // 1. Подтверждение готовности к платежу (PreCheckoutQuery)
    if (update.pre_checkout_query) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: update.pre_checkout_query.id,
          ok: true
        })
      });
      return res.status(200).send('ok');
    }

    // 2. Обработка успешного платежа
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payload = JSON.parse(payment.invoice_payload); // Получаем userId и amount из счета
      
      const userId = payload.userId;
      const amount = payload.amount;

      // Получаем текущий баланс пользователя
      const { data: user } = await supabase
        .from('profiles')
        .select('stars_balance')
        .eq('telegram_id', userId)
        .single();

      if (user) {
        // Начисляем звезды
        await supabase
          .from('profiles')
          .update({ stars_balance: user.stars_balance + amount })
          .eq('telegram_id', userId);
      }

      return res.status(200).send('ok');
    }

    res.status(200).send('ok');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('error');
  }
}