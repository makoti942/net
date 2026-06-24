const Database = require('better-sqlite3');
const db = new Database('wifi_portal.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    duration_minutes INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, -- IntaSend invoice_id
    mac_address TEXT,
    ip_address TEXT,
    phone_number TEXT,
    amount REAL,
    status TEXT DEFAULT 'PENDING',
    mikrotik_login_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial packages if empty
const pkgCount = db.prepare('SELECT COUNT(*) as count FROM packages').get().count;
if (pkgCount === 0) {
  const insert = db.prepare('INSERT INTO packages (name, price, duration_minutes) VALUES (?, ?, ?)');
  insert.run('1 Hour', 10, 60);
  insert.run('3 Hours', 25, 180);
  insert.run('24 Hours', 50, 1440);
  insert.run('7 Days', 300, 10080);
}

module.exports = db;
