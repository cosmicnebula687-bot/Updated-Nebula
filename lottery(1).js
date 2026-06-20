const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('./database');
const Lottery = require('./Lottery');
const LotteryDraw = require('./LotteryDraw');
const LotteryStats = require('./LotteryStats');
const { generateTicketNumber } = require('./lotteryScheduler');
const config = require('./config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lottery')
    .setDescription('🌌 Cosmic Lottery — try your luck!')
    .addSubcommand(sub =>
      sub.setName('buy')
        .setDescription('🎟️ Buy a cosmic lottery ticket'))
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('📊 View the current lottery pool and next draw'))
    .addSubcommand(sub =>
      sub.setName('leaderboard')
        .setDescription('👑 Top cosmic lottery winners')),
  cooldown: 3,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'buy') return handleBuy(interaction);
    if (sub === 'info') return handleInfo(interaction);
    if (sub === 'leaderboard') return handleLeaderboard(interaction);
  },
};

async function handleBuy(interaction) {
  const ticketCost = config.lottery.ticketCost;
  const user = await getUser(interaction.user.id);

  if (user.wallet < ticketCost) {
    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('❌ Insufficient Credits')
      .setDescription(`You need **${ticketCost.toLocaleString()} ☄️** to buy a ticket.\nYour wallet: **${user.wallet.toLocaleString()} ☄️**`)
      .setFooter({ text: '🌌 Nebula Bot • Cosmic Lottery' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  const ticketNumber = generateTicketNumber();
  user.wallet -= ticketCost;
  await user.save();

  await Lottery.create({
    userId: interaction.user.id,
    ticketNumber,
  });

  let stats = await LotteryStats.findOne({ userId: interaction.user.id });
  if (!stats) stats = await LotteryStats.create({ userId: interaction.user.id });
  stats.ticketsPurchased += 1;
  await stats.save();

  const activeCount = await Lottery.countDocuments({ drawId: null });
  const poolTotal = activeCount * ticketCost;

  const embed = new EmbedBuilder()
    .setColor(0x7B2FBE)
    .setTitle('🌌 Cosmic Lottery Ticket Purchased!')
    .setDescription(`Your ticket has been launched into the cosmos! 🚀\nThe draw happens **every day at 20:00 UTC**.`)
    .addFields(
      { name: '🎟️ Your Ticket Number', value: `\`\`\`${ticketNumber}\`\`\``, inline: false },
      { name: '☄️ Ticket Cost', value: `**${ticketCost.toLocaleString()}** Credits`, inline: true },
      { name: '👛 New Balance', value: `**${user.wallet.toLocaleString()}** Credits`, inline: true },
      { name: '🏆 Current Pool', value: `**${poolTotal.toLocaleString()}** Credits (${activeCount} tickets)`, inline: false },
      {
        name: '📋 Match Rules',
        value:
          '`8 digits` → 👑 **Jackpot** (80% of pool)\n' +
          '`6 digits` → 🥈 **Second Prize** (15% of pool)\n' +
          '`4 digits` → 🥉 **Third Prize** (5% of pool)',
        inline: false,
      },
    )
    .setFooter({ text: '🌌 Nebula Bot • Good luck, space traveler!' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function handleInfo(interaction) {
  const ticketCost = config.lottery.ticketCost;
  const activeTickets = await Lottery.countDocuments({ drawId: null });
  const totalPool = activeTickets * ticketCost;

  const lastDraw = await LotteryDraw.findOne({ status: 'completed' }).sort({ drawDate: -1 });

  const nextDraw = new Date();
  nextDraw.setUTCHours(20, 0, 0, 0);
  if (nextDraw <= new Date()) nextDraw.setUTCDate(nextDraw.getUTCDate() + 1);
  const msUntil = nextDraw - Date.now();
  const hours = Math.floor(msUntil / 3600000);
  const minutes = Math.floor((msUntil % 3600000) / 60000);

  const embed = new EmbedBuilder()
    .setColor(0x4A90D9)
    .setTitle('🌌 Cosmic Lottery — Current Status')
    .setDescription('The **🌌 Cosmic Lottery** draws every day at **20:00 UTC**.\nBuy tickets with `/lottery buy` or `n!lottery buy`!')
    .addFields(
      { name: '🎟️ Tickets Sold', value: `**${activeTickets.toLocaleString()}**`, inline: true },
      { name: '☄️ Current Pool', value: `**${totalPool.toLocaleString()}** Credits`, inline: true },
      { name: '⏰ Next Draw', value: `In **${hours}h ${minutes}m**`, inline: true },
      { name: '🎫 Ticket Price', value: `**${ticketCost.toLocaleString()}** Credits`, inline: true },
      {
        name: '🏆 Prize Distribution',
        value:
          '👑 **Jackpot** — 8 matching digits → 80% of pool\n' +
          '🥈 **Second Prize** — 6 matching digits → 15% of pool\n' +
          '🥉 **Third Prize** — 4 matching digits → 5% of pool',
        inline: false,
      },
    );

  if (lastDraw) {
    embed.addFields({
      name: '📜 Last Draw',
      value: `Winning number: \`${lastDraw.winningNumber}\` | Pool: **${lastDraw.totalPool.toLocaleString()}** ☄️ | Winners: **${lastDraw.winners.length}**`,
      inline: false,
    });
  }

  embed.setFooter({ text: '🌌 Nebula Bot • Cosmic Lottery' }).setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function handleLeaderboard(interaction) {
  const top = await LotteryStats.find({ lotteriesWon: { $gt: 0 } })
    .sort({ totalWinnings: -1 })
    .limit(10);

  if (top.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x7B2FBE)
      .setTitle('🌌 Cosmic Lottery Leaderboard')
      .setDescription('No winners yet! Be the first to claim the jackpot! 🚀')
      .setFooter({ text: '🌌 Nebula Bot • Cosmic Lottery' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  const medals = ['🥇', '🥈', '🥉'];
  const rows = top.map((s, i) =>
    `${medals[i] || `**${i + 1}.**`} <@${s.userId}> — ☄️ **${s.totalWinnings.toLocaleString()}** won | 🎟️ ${s.ticketsPurchased.toLocaleString()} tickets | 🏆 ${s.lotteriesWon} wins`,
  );

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle('👑 Cosmic Lottery Leaderboard')
    .setDescription('The luckiest travelers in the galaxy! 🌌\n\n' + rows.join('\n'))
    .setFooter({ text: '🌌 Nebula Bot • Cosmic Lottery' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
