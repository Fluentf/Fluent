// /api/analyze.js

// Importeer de 'dotenv' library om .env bestanden te lezen
require('dotenv').config();

// Dit is de serverless functie die Vercel/Netlify zal uitvoeren
export default async function handler(request, response) {
    // Sta alleen POST-verzoeken toe
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Alleen POST-verzoeken zijn toegestaan' });
    }

    try {
        // Haal de data uit het verzoek van de front-end
        const { scenario, userText } = request.body;

        // Haal de GEHEIME API-sleutel op uit de serveromgeving (.env bestand)
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OpenAI API-sleutel niet gevonden op de server.');
        }

        // Bouw de prompt, net als voorheen
        const klantContext = scenario.meta;
        const klantBericht = scenario.content.replace(/<[^>]*>?/gm, '');
        const systemPrompt = `Jij bent FoneFluent... (jouw volledige prompt hier)... Reactie om te analyseren: "${userText}"`;

        // Roep de OpenAI API aan VANAF DE SERVER
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: systemPrompt }],
                temperature: 0.4,
                response_format: { "type": "json_object" }
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`OpenAI API Fout: ${aiResponse.statusText}`);
        }

        const data = await aiResponse.json();
        const analysisData = JSON.parse(data.choices[0].message.content);

        // Stuur het succesvolle resultaat terug naar de front-end
        response.status(200).json(analysisData);

    } catch (error) {
        console.error("Fout in de proxy-functie:", error);
        response.status(500).json({ message: 'Er is een interne serverfout opgetreden.' });
    }
}
