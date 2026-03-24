const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "CaptiveRadar Proxy Online", version: "1.0" });
});

// Apollo people search proxy
app.post("/apollo/search", async (req, res) => {
  try {
    const { apiKey, ...searchParams } = req.body;
    if (!apiKey) return res.status(400).json({ error: "Missing apiKey" });

    const response = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ api_key: apiKey, ...searchParams }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Apollo error" });
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Apollo people enrichment proxy
app.post("/apollo/enrich", async (req, res) => {
  try {
    const { apiKey, ...params } = req.body;
    if (!apiKey) return res.status(400).json({ error: "Missing apiKey" });

    const response = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ api_key: apiKey, ...params }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CaptiveRadar proxy running on port ${PORT}`);
});
