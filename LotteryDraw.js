const mongoose = require('mongoose');

const lotteryDrawSchema = new mongoose.Schema({
  winningNumber: { type: String, length: 8, default: null },
  totalPool: { type: Number, default: 0 },
  ticketCount: { type: Number, default: 0 },
  jackpotPrize: { type: Number, default: 0 },
  secondPrize: { type: Number, default: 0 },
  thirdPrize: { type: Number, default: 0 },
  winners: [{
    userId: String,
    ticketNumber: String,
    prizeType: { type: String, enum: ['jackpot', 'second', 'third'] },
    prizeAmount: Number,
    matchedDigits: Number,
  }],
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  drawDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LotteryDraw', lotteryDrawSchema);
