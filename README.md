# MikroTik Wi-Fi Captive Portal with IntaSend STK Push

A complete, responsive Wi-Fi billing landing page and backend server using Node.js (Express) to act as an external captive portal for MikroTik routers.

## Features
- **Responsive UI:** Mobile-optimized landing page with package selection.
- **IntaSend Integration:** M-Pesa STK Push for seamless payments.
- **Real-time Fulfillment:** Uses Server-Sent Events (SSE) to detect payment success and auto-login the user.
- **MikroTik Compatible:** Handles standard `http-pap`/`http-chap` login redirections.

## Prerequisites
- Node.js installed on your server.
- An active [IntaSend](https://intasend.com) account for payment processing.
- A MikroTik router with Hotspot configured.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/makoti942/net.git
   cd net
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   INTASEND_PUBLISHABLE_KEY=your_publishable_key
   INTASEND_SECRET_KEY=your_secret_key
   NODE_ENV=development
   HOST_URL=https://your-server-domain.com
   PORT=3000
   ```

4. **Start the server:**
   ```bash
   node server.js
   ```

## MikroTik Configuration

### 1. Walled Garden
You must allow your users to access the payment gateway and your server before they are authenticated.
Add these to your MikroTik Walled Garden:
- `your-server-domain.com`
- `*intasend.com`
- `*google-analytics.com` (optional)

### 2. Hotspot Profile
Set the **Login Page URL** in your MikroTik Hotspot Profile to:
`https://your-server-domain.com/?mac=$(mac)&ip=$(ip)&link-login-only=$(link-login-only)`

## Project Structure
- `server.js`: Express backend with payment and SSE logic.
- `database.js`: SQLite schema for packages and transactions.
- `public/index.html`: Frontend dashboard and auto-login logic.
- `wifi_portal.db`: SQLite database (generated on first run).

## License
ISC
