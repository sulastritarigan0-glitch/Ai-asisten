export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Membaca API Key dari Vercel Environment Variables (GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum terpasang di Vercel Environment Variables.' });
  }

  try {
    const { prompt, systemMsg, useJSON, base64, mime } = req.body;
    
    // Memanggil model Gemini Flash melalui Serverless Backend Vercel
    const modelName = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let parts = [{ text: prompt }];
    if (base64 && mime) {
      const rawBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      parts.push({ inlineData: { mimeType: mime, data: rawBase64 } });
    }

    const payload = {
      contents: [{ role: "user", parts }],
      systemInstruction: { parts: [{ text: systemMsg }] }
    };

    if (useJSON) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              correctAnswer: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gagal dari Google API' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}