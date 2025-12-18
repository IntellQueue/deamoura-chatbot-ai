
require('dotenv').config();

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// The problematic model
const MODEL = "gemini-2.5-flash";

async function testGemini() {
    if (!API_KEY) {
        console.error("❌ API Key is missing in .env");
        return;
    }

    console.log(`Testing Gemini API with model: ${MODEL}`);
    console.log(`API Key present: ${API_KEY.length > 5 ? 'Yes' : 'No'}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{
            parts: [{ text: "Hello, are you online?" }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errText = await response.text();
            console.error("Error Body:", errText);
        } else {
            const data = await response.json();
            console.log("Success:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testGemini();
