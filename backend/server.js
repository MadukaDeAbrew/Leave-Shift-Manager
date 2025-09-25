const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// === Existing Routes ===
app.use('/api/auth', require('./routes/authRoutes')); //- sp1
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/swaps', require('./routes/swapRoutes'));


// simple health check (no auth)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    ts: new Date().toISOString()
  });
});

app.get('/', (_req, res) => res.send('OK'));

// Export the app object for testing
if (require.main === module) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
