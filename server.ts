import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { Resend } from "resend";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Allow framing for WordPress embedding
  app.use((req, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    next();
  });

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

  app.post("/api/send-reminders", async (req, res) => {
    const { users, games, year } = req.body;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return res.status(500).json({ error: "Resend API key not configured" });
    }

    const resend = new Resend(resendApiKey);

    try {
      // Identify current round (first round that has incomplete games)
      const currentRound = games.find((g: any) => g.complete < 100)?.round || 1;
      const roundGames = games.filter((g: any) => g.round === currentRound);
      const roundGameCount = roundGames.length;

      const usersToRemind = users.filter((user: any) => {
        if (!user.email) return false;
        const userTips = user.tips?.[year]?.[currentRound] || [];
        // If they have fewer tips than games in the round, they need a reminder
        return userTips.length < roundGameCount;
      });

      if (usersToRemind.length === 0) {
        return res.json({ message: "No users need reminders for this round." });
      }

      const results = await Promise.all(
        usersToRemind.map((user: any) =>
          resend.emails.send({
            from: 'Tipping Comp <onboarding@resend.dev>',
            to: user.email,
            subject: `Tipping Reminder: Round ${currentRound}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb; text-transform: uppercase; font-style: italic;">Tipping Reminder</h2>
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>You haven't finished your tips for <strong>Round ${currentRound}</strong> yet!</p>
                <p style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
                  There are <strong>${roundGameCount}</strong> games this round and you've only tipped <strong>${user.tips?.[year]?.[currentRound]?.length || 0}</strong>.
                </p>
                <p>Head over to the app and get them in before the first bounce!</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #64748b;">
                  This is an automated reminder from Adrian's Family Tipping Comp.
                </div>
              </div>
            `,
          })
        )
      );

      res.json({ message: `Successfully sent ${results.length} reminders.` });
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ error: "Failed to send reminders" });
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
