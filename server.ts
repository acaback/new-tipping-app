import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Proxy for Squiggle API to avoid CORS and "Failed to fetch" issues in browser
  app.get("/api/squiggle/games", async (req, res) => {
    const { year } = req.query;
    try {
      const response = await fetch(`https://api.squiggle.com.au/?q=games&year=${year}`, {
        headers: {
          'User-Agent': 'AdrianFamilyTippingComp/1.0 (Contact: acaback@gmail.com)'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Squiggle Games Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch games from Squiggle" });
    }
  });

  app.get("/api/squiggle/ladder", async (req, res) => {
    const { year } = req.query;
    try {
      const response = await fetch(`https://api.squiggle.com.au/?q=ladder&year=${year}`, {
        headers: {
          'User-Agent': 'AdrianFamilyTippingComp/1.0 (Contact: acaback@gmail.com)'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Squiggle Ladder Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch ladder from Squiggle" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
