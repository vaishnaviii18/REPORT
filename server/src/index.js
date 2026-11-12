require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const push = require('./utils/push');
const { errorHandler } = require('./utils/http');

const app = express();

// Only our own website may call the API from a browser
const allowed = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed }));
app.use(express.json({ limit: '100kb' }));

// Health check (also handy for waking the free server)
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
// Group sub-sections first, then the group routes themselves
app.use('/api/groups/:groupId/reports', require('./routes/reports'));
app.use('/api/groups/:groupId/snaps', require('./routes/snaps'));
app.use('/api/groups/:groupId/uploads', require('./routes/uploads'));
app.use('/api/groups/:groupId/nudges', require('./routes/nudges'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/push', require('./routes/push'));
app.use('/api/jobs', require('./routes/jobs'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing settings: ${missing.join(', ')}. See .env.example`);
  process.exit(1);
}

push.setup();
const port = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(port, () => console.log(`The Report API running on port ${port}`)))
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
