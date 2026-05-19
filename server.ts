import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // OneSignal Send Push API
  app.post('/api/push', async (req, res) => {
    const { message, recipients, title } = req.body;
    
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "e187962a-f10d-4758-a048-498513d8bbde";

    if (!ONESIGNAL_REST_API_KEY) {
      console.warn('ONESIGNAL_REST_API_KEY not found in environment');
      return res.status(500).json({ error: 'Push notifications not configured' });
    }

    try {
      const response = await axios.post('https://onesignal.com/api/v1/notifications', {
        app_id: ONESIGNAL_APP_ID,
        contents: { en: message, es: message },
        headings: { en: title || 'AsistenciaPro', es: title || 'AsistenciaPro' },
        // If recipients is provided, we use external_id
        include_external_user_ids: recipients || undefined,
        // If no recipients, we send to all subscribed
        included_segments: recipients ? undefined : ['Subscribed Users']
      }, {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error('Error sending push:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
