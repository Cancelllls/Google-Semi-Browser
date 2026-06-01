/**
 * TRUE CHROMIUM / SPA REVERSE PROXY (Node.js)
 * 
 * Instructions:
 * 1. Install Node.js on a VPS (DigitalOcean, Render, Heroku) or your local machine.
 * 2. Run: npm install express http-proxy-middleware cors
 * 3. Run: node server.js
 * 4. Browse to http://localhost:3000?url=https://duck.ai
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const app = express();

app.use(cors());

// The interceptor middleware
app.use('/', (req, res, next) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.send(`
      <h1 style="font-family:sans-serif; text-align:center; margin-top:20%;">
        True Server-Side Proxy<br>
        <a href="/?url=https://duck.ai">Launch Duck.ai</a>
      </h1>
    `);
  }

  // Set up the high-fidelity proxy
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    ws: true, // FULL WEBSOCKET SUPPORT (Fixes ChatGPT)
    onProxyReq: (proxyReq, req, res) => {
      // Spoof Origin and Referer dynamically to bypass CORS completely
      const urlObj = new URL(targetUrl);
      proxyReq.setHeader('Origin', urlObj.origin);
      proxyReq.setHeader('Referer', urlObj.origin + '/');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Allow Server-Sent Events (SSE) to stream seamlessly (Fixes Duck.ai)
      // Strip framing protection headers
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
    },
    onError: (err, req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Proxy Error: ' + err.message);
    }
  })(req, res, next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`True VPS Proxy running on http://localhost:${PORT}`);
});
