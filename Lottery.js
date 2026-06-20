const mongoose = require('mongoose');

const lotterySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  ticketNumber: { type: String, required: true, length: 8 },
  purchaseDate: { type: Date, default: Date.now },
  drawId: { type: mongoose.Schema.Types.ObjectId, ref: 'LotteryDraw', default: null },
  claimed: { type: Boolean, default: false },
}, { timestamps: true });

lotterySchema.index({ userId: 1 });
lotterySchema.index({ ticketNumber: 1 });
lotterySchema.index({ drawId: 1 });

module.exports = mongoose.model('Lottery', lotterySchema);
