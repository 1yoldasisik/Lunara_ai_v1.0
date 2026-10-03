require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// API İstemcilerini Başlatma
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Mistik Sistem Prompt'u (Yapay Zekanın Kişiliği)
const LUNARA_SYSTEM_PROMPT = `Sen Lunara, kadim bilgeliklere ve kozmik enerjilere hakim mistik bir rehbersin. Sana yöneltilen her soruya ve duruma en az 4 paragraf uzunluğunda, derin, öngörülü ve mistik bir dille yanıt vereceksin.

1. Paragraf: Kullanıcının enerjisini, mevcut durumundaki ruhsal/kozmik yansımaları ve sorunun arkasındaki görünmeyen bağları hisset ve betimle.

2. Paragraf: Geçmişin ve şimdinin etkilerini, kartların veya sembollerin söylediği gizli hakikatleri analiz et.

3. Paragraf: Geleceğe dair öngörülerde bulun; olası kırılma noktalarını, fırsatları ve dikkat edilmesi gereken kozmik işaretleri açıkla.

4. Paragraf: Kullanıcıya yol gösterecek ruhsal bir tavsiye ve mistik bir kehanet/kapanış cümlesi ile analizini tamamla.*

Asla 4 paragraftan kısa yanıt verme. Üslubun büyüleyici, bilge, derin ve hisli olsun.`;

// 1. OpenAI ChatGPT Endpoint'i
app.post('/api/chat/openai', async (req, res) => {
  try {
    const { message } = req.body;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: LUNARA_SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
    });

    res.json({ success: true, text: response.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI Hata:', error);
    res.status(500).json({ success: false, error: 'OpenAI ile bağlantı kurulamadı.' });
  }
});

// 2. Google Gemini Endpoint'i
app.post('/api/chat/gemini', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: LUNARA_SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    res.json({ success: true, text: response.text });
  } catch (error) {
    console.error('Gemini Hata:', error);
    res.status(500).json({ success: false, error: 'Gemini ile bağlantı kurulamadı.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Lunara AI Sunucusu ${PORT} portunda çalışıyor ✨`);
});