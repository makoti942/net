require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const IntaSend = require('intasend-node');
const db = require('./database');
const path = require('path');
const EventEmitter = require('events');

const app = express();
const port = process.env.PORT || 3000;
const paymentEvents = new EventEmitter();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// IntaSend Configuration
const intasend = new IntaSend({
  publishableKey: process.env.INTASEND_PUBLISHABLE_KEY,
  secretKey: process.env.INTASEND_SECRET_KEY,
  test: process.env.NODE_ENV !== 'production',
});

// Helper to format phone numbers to 254...
function formatPhone(phone) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.substring(1);
  if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;
  return p;
}

// Routes
app.get('/api/packages', (req, res) => {
  const packages = db.prepare('SELECT * FROM packages').all();
  res.json(packages);
});

app.post('/api/pay', async (req, res) => {
  const { phone, amount, mac, ip, loginUrl, packageId } = req.body;
  const formattedPhone = formatPhone(phone);

  try {
    const collection = intasend.collection();
    const response = await collection.mpesaStkPush({
      first_name: 'Customer',
      last_name: 'WiFi',
      email: 'customer@wifi.local',
      phone_number: formattedPhone,
      amount: amount,
      host: process.env.HOST_URL || 'http://localhost:3000',
      api_ref: `WIFI-${mac}-${Date.now()}`
    });

    // Store transaction
    db.prepare(`
      INSERT INTO transactions (id, mac_address, ip_address, phone_number, amount, mikrotik_login_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(response.invoice.invoice_id, mac, ip, formattedPhone, amount, loginUrl);

    res.json({ invoice_id: response.invoice.invoice_id });
  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

app.post('/api/webhook', (req, res) => {
  const payload = req.body;
  console.log('Webhook received:', JSON.stringify(payload, null, 2));

  const { invoice_id, state } = payload;

  if (state === 'COMPLETE') {
    const trans = db.prepare('SELECT mac_address FROM transactions WHERE id = ?').get(invoice_id);
    if (trans) {
      db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('COMPLETE', invoice_id);
      paymentEvents.emit(`paid-${trans.mac_address}`, { status: 'PAID' });
    }
  } else if (state === 'FAILED') {
    db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('FAILED', invoice_id);
  }

  res.sendStatus(200);
});

app.get('/api/status-stream', (req, res) => {
  const mac = req.query.mac;
  if (!mac) return res.status(400).send('MAC required');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onPaid = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.end();
  };

  paymentEvents.once(`paid-${mac}`, onPaid);

  req.on('close', () => {
    paymentEvents.removeListener(`paid-${mac}`, onPaid);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
