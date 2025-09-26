
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const Shift = require('../models/Shift');
const { isValidSlot } = require('../config/slots');


dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());
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
//app.use('/api/tasks', require('./routes/taskRoutes'));

// Export the app object for testing
// only listen if run directly (not when required by tests)
if (require.main === module) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}




//ShfitService

class ShiftService {
  async list({from, to, scope, roleInwork, userId}){}
  async listUnassigned({from, to}){}
  async assign(shiftId, userIds){return ture}
}

module.exports = app

//ShiftService decorators
//manager
exports.withUassignFlag = (shifts) =>
  shifts.map(shift =>({
  ...shift.toObject?.() ?? shift, //...express methods in mongo. s.toObject?.() → undefined
  meta: { ...(shift.meta || {}), unassigned: shift.status === 'unassigned' },
}));

//User
exports.withPreferenceMatch = (shifts, preference) =>
  shifts.map(s => {
    const weekday = new Date(s.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short'}).slice(0,3).toLowerCase();
    const slot = toSlot(s.startTime, s.endTime); // morning/afternoon/evening/night
    const hit = !!pref?.weekdays?.[weekday]?.[slot];
    return { ...s.toObject?.() ?? s, meta: { ...(s.meta||{}), matchesPreference: hit } };
  });

