const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Lottery = require('./Lottery');
const config = require('./config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('🎟️ View your active cosmic lottery tickets'),
  cooldown: 3,

  async execute(interaction) {
    const userId = interaction.user.id;
    const tickets = await Lottery.find({ userId, drawId: null }).sort({ purchaseDate: -1 }).limit(25);

    if (tickets.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x4A90D9)
        .setTitle('🎟️ Your Cosmic Tickets')
        .setDescription('You have no active tickets in the current draw.\n\nBuy one with `/lottery buy` or `n!lottery buy`!')
        .setFooter({ text: '🌌 Nebula Bot • Cosmic Lottery' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const totalPool = (await Lottery.countDocuments({ drawId: null })) * config.lottery.ticketCost;

    const ticketList = tickets.map((t, i) =>
      `**${i + 1}.** \`${t.ticketNumber}\` — <t:${Math.floor(t.purchaseDate / 1000)}:R>`,
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x7B2FBE)
      .setTitle('🎟️ Your Cosmic Lottery Tickets')
      .setDescription(`You have **${tickets.length}** active ticket${tickets.length !== 1 ? 's' : ''} in the current draw!\n\n${ticketList}`)
      .addFields(
        { name: '☄️ Current Pool', value: `**${totalPool.toLocaleString()}** Credits`, inline: true },
        { name: '⏰ Next Draw', value: 'Daily at **20:00 UTC**', inline: true },
        {
          name: '📋 Match Rules',
          value: '`8 digits` → 👑 Jackpot | `6 digits` → 🥈 Second | `4 digits` → 🥉 Third',
          inline: false,
        },
      )
      .setFooter({ text: '🌌 Nebula Bot • Good luck, space traveler!' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
