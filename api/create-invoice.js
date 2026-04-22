export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Метод не разрешен' });

  const { amount, userId } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Пополнение баланса",
        description: `Покупка ${amount} звезд для использования в AI агрегаторе`,
        payload: JSON.stringify({ userId, amount }), // Данные для обработки после оплаты
        provider_token: "", // Для Telegram Stars оставляем пустым
        currency: "XTR", // Валюта Telegram Stars
        prices: [{ label: "Звезды", amount: amount }]
      })
    });

    const data = await response.json();

    if (data.ok) {
      res.status(200).json({ link: data.result });
    } else {
      res.status(500).json({ error: data.description });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}