const mongoose = require('mongoose');

const lotteryStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  ticketsPurchased: { type: Number, default: 0 },
  lotteriesWon: { type: Number, default: 0 },
  totalWinnings: { type: Number, default: 0 },
  biggestWin: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('LotteryStats', lotteryStatsSchema);
