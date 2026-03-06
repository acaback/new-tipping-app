import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Proxy for Squiggle API to avoid CORS and "Failed to fetch" issues in browser
app.get('/api/squiggle/games', async (req, res) => {
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
    console.error('Squiggle Games Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch games from Squiggle' });
  }
});

app.get('/api/squiggle/ladder', async (req, res) => {
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
    console.error('Squiggle Ladder Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch ladder from Squiggle' });
  }
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/send-report', async (req, res) => {
  const { to, subject, html } = req.body;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured.' });
  }

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Tipping Comp <noreply@adrian.familly>',
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ message: 'Email sent successfully.', data });
    } else {
      return res.status(response.status).json({ error: 'Failed to send email.', details: data });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while sending the email.' });
  }
});

app.post('/api/send-reminders', async (req, res) => {
  const { users, games, year } = req.body;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      return res.status(500).json({ error: 'Resend API key is not configured.' });
  }

  if (!users || !games || !year) {
      return res.status(400).json({ error: 'Missing required data: users, games, year.' });
  }

  // 1. Find the current round
  const now = new Date();
  const upcomingGames = games
      .filter((g: any) => new Date(g.date) > now && g.complete !== 100)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcomingGames.length === 0) {
      return res.status(200).json({ message: 'No upcoming games found. No reminders sent.' });
  }

  const currentRound = upcomingGames[0].round;
  const currentRoundGames = games.filter((g: any) => g.round === currentRound);

  // 2. Find users who need a reminder
  const usersToRemind = users.filter((user: any) => {
      if (user.isAdmin) return false; // Don't remind admins

      const userTipsForRound = user.tips[year]?.[currentRound] || [];
      return userTipsForRound.length < currentRoundGames.length;
  });

  if (usersToRemind.length === 0) {
      return res.status(200).json({ message: 'All users have completed their tips. No reminders sent.' });
  }

  // 3. Send emails
  try {
      const emailPromises = usersToRemind.map((user: any) => {
          const subject = `Friendly Reminder: AFL Tipping for Round ${currentRound} is due!`;
          const html = `
              <p>Hi ${user.name},</p>
              <p>This is a friendly reminder to get your tips in for Round ${currentRound}.</p>
              <p>The first game is approaching soon!</p>
              <p>Good luck!</p>
              <p>From the Family Tipping Comp</p>
          `;

          return fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                  from: 'Tipping Comp Reminder <noreply@adrian.familly>',
                  to: user.email,
                  subject,
                  html,
              }),
          });
      });

      const results = await Promise.all(emailPromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
           return res.status(500).json({ error: `Sent ${usersToRemind.length - failed.length} reminders, but ${failed.length} failed.` });
      }

      return res.status(200).json({ message: `Successfully sent ${usersToRemind.length} reminder(s).` });

  } catch (error) {
      console.error('Error sending reminder emails:', error);
      return res.status(500).json({ error: 'An unexpected error occurred while sending reminders.' });
  }
});

export const api = functions.https.onRequest(app);
