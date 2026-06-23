const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const { getUser } = require('./database');
const config = require('./config');

const OWNER_ID = '1353026685628448820';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-money')
    .setDescription('➕ Add Cosmic Credits to a user')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User to add credits to')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Amount to add')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(opt =>
      opt
        .setName('location')
        .setDescription('Wallet or bank')
        .addChoices(
          { name: 'Wallet', value: 'wallet' },
          { name: 'Bank', value: 'bank' }
        )
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  cooldown: 3,

  async execute(interaction) {

    // Owner-only check
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '❌ This command is restricted to the bot owner.',
        ephemeral: true,
      });
    }

    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const location =
      interaction.options.getString('location') || 'wallet';

    const user = await getUser(target.id);

    user[location] += amount;
    await user.save();

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('➕ Credits Added')
      .addFields(
        {
          name: '👤 User',
          value: target.tag,
          inline: true,
        },
        {
          name: '💰 Added',
          value: `☄️ **${amount.toLocaleString()}** to ${location}`,
          inline: true,
        },
        {
          name: '💼 New Balance',
          value: `Wallet: ${user.wallet.toLocaleString()} | Bank: ${user.bank.toLocaleString()}`,
          inline: false,
        }
      )
      .setFooter({ text: '🌌 Nebula Bot' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};
