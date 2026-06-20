const cron = require('node-cron');
const Lottery = require('./Lottery');
const LotteryDraw = require('./LotteryDraw');
const LotteryStats = require('./LotteryStats');
const { getUser } = require('./database');
const config = require('./config');
const { EmbedBuilder } = require('discord.js');

function generateTicketNumber() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function countMatchingDigits(a, b) {
  let matches = 0;
  for (let i = 0; i < 8; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches;
}

async function runLotteryDraw(client) {
  try {
    const tickets = await Lottery.find({ drawId: null });
    if (tickets.length === 0) {
      console.log('🎟️ Lottery draw skipped — no tickets sold.');
      return;
    }

    const ticketCost = config.lottery.ticketCost;
    const totalPool = tickets.length * ticketCost;
    const jackpotPool  = Math.floor(totalPool * 0.80);
    const secondPool   = Math.floor(totalPool * 0.15);
    const thirdPool    = Math.floor(totalPool * 0.05);

    const winningNumber = generateTicketNumber();

    const draw = await LotteryDraw.create({
      winningNumber,
      totalPool,
      ticketCount: tickets.length,
      jackpotPrize: jackpotPool,
      secondPrize: secondPool,
      thirdPrize: thirdPool,
      status: 'pending',
    });

    const jackpotWinners = [];
    const secondWinners  = [];
    const thirdWinners   = [];

    for (const ticket of tickets) {
      const matched = countMatchingDigits(ticket.ticketNumber, winningNumber);
      if (matched === 8) jackpotWinners.push(ticket);
      else if (matched >= 6) secondWinners.push(ticket);
      else if (matched >= 4) thirdWinners.push(ticket);
    }

    const drawWinners = [];

    async function distributeToWinners(winnerTickets, prizeType, totalPrize) {
      if (winnerTickets.length === 0) return;
      const share = Math.floor(totalPrize / winnerTickets.length);
      for (const ticket of winnerTickets) {
        const user = await getUser(ticket.userId);
        user.wallet += share;
        await user.save();

        let stats = await LotteryStats.findOne({ userId: ticket.userId });
        if (!stats) stats = await LotteryStats.create({ userId: ticket.userId });
        stats.lotteriesWon += 1;
        stats.totalWinnings += share;
        if (share > stats.biggestWin) stats.biggestWin = share;
        await stats.save();

        drawWinners.push({
          userId: ticket.userId,
          ticketNumber: ticket.ticketNumber,
          prizeType,
          prizeAmount: share,
          matchedDigits: prizeType === 'jackpot' ? 8 : prizeType === 'second' ? 6 : 4,
        });
      }
    }

    await distributeToWinners(jackpotWinners, 'jackpot', jackpotPool);
    await distributeToWinners(secondWinners,  'second',  secondPool);
    await distributeToWinners(thirdWinners,   'third',   thirdPool);

    draw.winners = drawWinners;
    draw.status = 'completed';
    await draw.save();

    await Lottery.updateMany({ drawId: null }, { $set: { drawId: draw._id } });

    console.log(`🌌 Lottery draw complete! Winning number: ${winningNumber} | Tickets: ${tickets.length} | Winners: ${drawWinners.length}`);

    await announceResults(client, draw, winningNumber, jackpotWinners, secondWinners, thirdWinners, jackpotPool, secondPool, thirdPool, totalPool);
  } catch (err) {
    console.error('❌ Lottery draw error:', err);
  }
}

async function announceResults(client, draw, winningNumber, jackpotWinners, secondWinners, thirdWinners, jackpotPool, secondPool, thirdPool, totalPool) {
  const GuildSettings = require('./GuildSettings');
  const guilds = await GuildSettings.find({ logsChannel: { $ne: null } });

  const embed = new EmbedBuilder()
    .setColor(0x7B2FBE)
    .setTitle('🚀 Cosmic Lottery Draw Complete!')
    .setDescription(`The galaxy has spoken! Here are the results of tonight's **🌌 Cosmic Lottery**.`)
    .addFields(
      { name: '🎟️ Winning Number', value: `\`${winningNumber}\``, inline: true },
      { name: '☄️ Total Pool', value: `**${totalPool.toLocaleString()}** Credits`, inline: true },
      { name: '🎫 Tickets Sold', value: `**${draw.ticketCount.toLocaleString()}**`, inline: true },
      {
        name: '👑 Jackpot (8 digits) — 80%',
        value: jackpotWinners.length > 0
          ? jackpotWinners.map(t => `<@${t.userId}> (\`${t.ticketNumber}\`) — **${Math.floor(jackpotPool / jackpotWinners.length).toLocaleString()}** ☄️`).join('\n')
          : '*No jackpot winners*',
        inline: false,
      },
      {
        name: '🥈 Second Prize (6 digits) — 15%',
        value: secondWinners.length > 0
          ? secondWinners.map(t => `<@${t.userId}> (\`${t.ticketNumber}\`) — **${Math.floor(secondPool / secondWinners.length).toLocaleString()}** ☄️`).join('\n')
          : '*No second prize winners*',
        inline: false,
      },
      {
        name: '🥉 Third Prize (4 digits) — 5%',
        value: thirdWinners.length > 0
          ? thirdWinners.map(t => `<@${t.userId}> (\`${t.ticketNumber}\`) — **${Math.floor(thirdPool / thirdWinners.length).toLocaleString()}** ☄️`).join('\n')
          : '*No third prize winners*',
        inline: false,
      },
    )
    .setFooter({ text: '🌌 Nebula Bot • Cosmic Lottery' })
    .setTimestamp();

  for (const settings of guilds) {
    try {
      const channel = await client.channels.fetch(settings.logsChannel).catch(() => null);
      if (channel && channel.isTextBased()) {
        await channel.send({ embeds: [embed] });
      }
    } catch {}
  }
}

function start(client) {
  cron.schedule('0 20 * * *', () => {
    console.log('🎟️ Running daily lottery draw...');
    runLotteryDraw(client);
  }, { timezone: 'UTC' });

  console.log('🎟️ Lottery scheduler started (draws at 20:00 UTC daily)');
}

module.exports = { start, runLotteryDraw, generateTicketNumber };
