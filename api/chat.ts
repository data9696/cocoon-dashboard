export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  
  // @ts-ignore
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' })
    return
  }

  const { message, context } = req.body || {}
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Missing message' })
    return
  }

  const systemPrompt = `You are a helpful sales-data assistant for Fashion 1972NE (Cocoon Care & The Boo Boo Club).
You are given a snapshot of the dashboard's current data below. Answer the user's question using ONLY this data.
If the data doesn't contain what's needed to answer, say so plainly instead of guessing.
Keep answers short and concrete — use actual numbers from the data provided.

DASHBOARD DATA SNAPSHOT:
${JSON.stringify(context, null, 2)}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      res.status(502).json({ error: 'Gemini API error', detail: errText })
      return
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || 'No response.'
    res.status(200).json({ reply })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Unknown error' })
  }
}
