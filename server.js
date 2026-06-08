const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SEARCH_API_KEY = process.env.SEARCH_API_KEY || "";

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/chat", async (req, res) => {
  try {
    const userMsg = (req.body.message || "").trim();

    if (!userMsg) {
      return res.json({
        reply: "🙏 MS Manish Digital Cyber Expert में आपका स्वागत है। कृपया अपना प्रश्न लिखें, हम आपकी सहायता के लिए तैयार हैं।"
      });
    }

    if (!GEMINI_API_KEY) {
      return res.json({
        reply: "Gemini API key set nahi hai. Render Environment me GEMINI_API_KEY add karein."
      });
    }

    const q = userMsg.toLowerCase();

    const needSearch =
      q.includes("admission") ||
      q.includes("vacancy") ||
      q.includes("scholarship") ||
      q.includes("result") ||
      q.includes("admit card") ||
      q.includes("latest") ||
      q.includes("last date");

    let results = "Live search ki zarurat nahi hai ya Search API key set nahi hai.";

    if (needSearch && SEARCH_API_KEY) {
      try {
        const search = await axios.get("https://www.searchapi.io/api/v1/search", {
          params: {
            engine: "google",
            q: userMsg + " official latest notice",
            api_key: SEARCH_API_KEY
          }
        });

        results = (search.data.organic_results || [])
          .slice(0, 3)
          .map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\n${r.link}`)
          .join("\n\n") || "Live search result available nahi hai.";
      } catch (e) {
        results = "Live search result available nahi hai.";
      }
    }

    const prompt = `
Aap MS Manish AI Assistant hain.

RULES:
- Hindi/Hinglish me seedha jawab dein.
- Boss, Sir, Madam, Dear jaise shabd reply me na use karein.
- Bina zarurat lamba jawab na dein.
- Date ya official notice guess na karein.
- Agar exact official jankari clear na mile to likhein: "Exact official jankari clear nahi mili, official website check karein."
- Admission, Result, Admit Card, Vacancy aur Scholarship ke sawalon me Search Results ko pehle use karein.
- Uttar ko 3-5 line me spasht roop se dein.

User Question:
${userMsg}

Search Results:
${results}

Final Answer:
`;

    const gemini = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      gemini.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Response nahi mila.";

    return res.json({ reply });

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);

    return res.json({
      reply: "AI server par abhi adhik load hai. Kripya thodi der baad phir prayas karein."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ MS Manish AI Server Running on port " + PORT);
});
