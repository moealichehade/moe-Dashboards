const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const NOTION_TOKEN = 'ntn_N66252122223xldQn6fe02gHbeYQBsFlrIBIu14JbWk6Vz';
const NOTION_VERSION = '2022-06-28';

app.use('/notion', async (req, res) => {
  const url = `https://api.notion.com/v1${req.url}`;
  try {
    let body = req.body;
    if (body && body.properties) {
      const props = body.properties;
      const newProps = {};
      const dateMap = {};
      for (const [key, val] of Object.entries(props)) {
        if (key.startsWith('date:')) {
          const parts = key.split(':');
          const propName = parts[1];
          const dateKey = parts[2];
          if (!dateMap[propName]) dateMap[propName] = {};
          dateMap[propName][dateKey] = val;
        } else {
          newProps[key] = val;
        }
      }
      for (const [propName, dateVal] of Object.entries(dateMap)) {
        newProps[propName] = { date: dateVal };
      }
      body = { ...body, properties: newProps };
    }
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: ['POST','PATCH','PUT'].includes(req.method) ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    res.json(data);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', port: 3001 }));
app.use(express.static(path.join(process.env.HOME, 'Documents/moe-dashboards/intervention-dashboard')));
app.listen(3001, () => console.log('Proxy running at http://localhost:3001'));
