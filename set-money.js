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
    .setName('set-money')
    .setDescription('💰 Set a user\'s Cosmic Credits to a specific amount')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User to set')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Amount to set')
        .setRequired(true)
        .setMinValue(0)
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
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  cooldown: 3,

  async execute(interaction) {

    // OWNER ONLY
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

    user[location] = amount;

    await user.save();

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle('💰 Credits Set')
      .addFields(
        {
          name: '👤 User',
          value: target.tag,
          inline: true,
        },
        {
          name: '💰 Set To',
          value: `☄️ **${amount.toLocaleString()}** in ${location}`,
          inline: true,
        },
        {
          name: '💼 Current Balance',
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
