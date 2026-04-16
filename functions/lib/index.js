"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Allow framing for WordPress embedding
app.use((req, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    next();
});
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        }
        else {
            return res.status(response.status).json({ error: 'Failed to send email.', details: data });
        }
    }
    catch (error) {
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
        .filter((g) => new Date(g.date) > now && g.complete !== 100)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (upcomingGames.length === 0) {
        return res.status(200).json({ message: 'No upcoming games found. No reminders sent.' });
    }
    const currentRound = upcomingGames[0].round;
    const currentRoundGames = games.filter((g) => g.round === currentRound);
    // 2. Find users who need a reminder
    const usersToRemind = users.filter((user) => {
        var _a;
        if (user.isAdmin)
            return false; // Don't remind admins
        const userTipsForRound = ((_a = user.tips[year]) === null || _a === void 0 ? void 0 : _a[currentRound]) || [];
        return userTipsForRound.length < currentRoundGames.length;
    });
    if (usersToRemind.length === 0) {
        return res.status(200).json({ message: 'All users have completed their tips. No reminders sent.' });
    }
    // 3. Send emails
    try {
        const emailPromises = usersToRemind.map((user) => {
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
    }
    catch (error) {
        console.error('Error sending reminder emails:', error);
        return res.status(500).json({ error: 'An unexpected error occurred while sending reminders.' });
    }
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map