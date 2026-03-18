import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AuthorizedOps backend is running' });
});

// Placeholder for AI agent endpoints
app.post('/api/agent/action', (req, res) => {
  res.json({ message: 'AI Agent action endpoint', status: 'placeholder' });
});

app.listen(port, () => {
  console.log(`AuthorizedOps backend listening on port ${port}`);
});
