const express = require('express');
const { createServer } = require('cors-anywhere');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsServer = createServer({
  originWhitelist: [],
  requireHeader: [],
  removeHeaders: ['cookie', 'cookie2'],
  httpProxyOptions: {
    xfwd: false,
    secure: false
  }
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const staticPath = path.join(__dirname, './interface-build');
app.use('/', express.static(staticPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.use('/api', (req, res, next) => {
  req.url = req.url.replace(/^\/api\//, '');
  corsServer.emit('request', req, res);
});

app.listen(PORT, () => {
  console.log(`Server up http://localhost:${PORT}`);
});
