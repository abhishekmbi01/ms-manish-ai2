const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SEARCH_API_KEY = "fVnC5SRnkJH8DiutEsz1e28g";

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/chat", async (req, res) => {
  try {
    const userMsg = (req.body.message || "").trim();

    if (!userMsg) {
      return res.json({ reply: "Kripya apna prashn likhiye." });
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

    let results = "";

    if (needSearch) {
      try {
        const search = await axios.get("https://www.searchapi.io/api/v1/search", {
          params: {
            engine: "google",
            q: userMsg + " official latest notice",
            api_key: SEARCH_API_KEY
          }
        });

        results = (search.data.organic_results || [])
          .slice(0, 2)
          .map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\n${r.link}`)
          .join("\n\n");

      } catch (e) {
        console.log("Search Error:", e.message);
        results = "Live search result available nahi hai.";
      }
    } else {
      results = "Live search ki zarurat nahi hai. General answer dein.";
    }

    const ai = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2:3b",
      stream: false,
      prompt: `
Aap MS Manish AI Assistant hain.

STRICT RULES:
- Hindi me jawab dein.
- Boss, Sir, Madam, Dear jaise shabd na use karein.
- Answer ki shuruaat "Aap" se na karein.
- Sirf seedha tathyaatmak jawab dein.
- Answer complete sentence me dein.
- Agar answer 1 line me ho sakta hai to 1 line me dein.
- Bina zarurat lamba jawab na dein.
- Search Results ko seedha copy na karein.
- Search Results ko padhkar short summary dein.
- Bina zarurat links ki list na dein.
- Link tabhi dein jab bahut zaruri ho.
- Galat jankari ya date guess na karein.
- Agar exact official jankari clear na mile to likhein: "Exact official jankari clear nahi mili, official website check karein."

User Question:
${userMsg}

Search Results:
${results}

Final Answer:
`
    });

    res.json({ reply: ai.data.response || "Response nahi mila." });

  } catch (err) {
    console.log("ERROR:", err.message);
    res.json({
      reply: "Server, SearchAPI ya Ollama me error hai. Kripya CMD check karein."
    });
  }
});

app.listen(3000, () => {
  console.log("✅ Fast Live MS Manish AI Server Running : http://localhost:3000");
});