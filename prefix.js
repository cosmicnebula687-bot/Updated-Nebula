const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('./GuildSettings');
const config = require('./config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('⚙️ View or change the bot prefix for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('new_prefix')
        .setDescription('The new prefix (e.g. ?, $, n!)')
        .setRequired(false)
        .setMaxLength(5)),
  cooldown: 5,

  async execute(interaction) {
    const newPrefix = interaction.options.getString('new_prefix');
    const guildId = interaction.guildId;
    const defaultPrefix = 'n!';

    if (!newPrefix) {
      let settings = await GuildSettings.findOne({ guildId });
      const current = settings?.prefix ?? defaultPrefix;
      const embed = new EmbedBuilder()
        .setColor(0x7B2FBE)
        .setTitle('⚙️ Current Prefix')
        .setDescription(`The current prefix for this server is \`${current}\`\n\nChange it with \`/prefix new_prefix:<value>\` or \`${current}prefix <value>\``)
        .setFooter({ text: '🌌 Nebula Bot' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (newPrefix.length > 5) {
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('❌ Invalid Prefix')
        .setDescription('Prefix must be **5 characters or fewer**.')
        .setFooter({ text: '🌌 Nebula Bot' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await GuildSettings.findOneAndUpdate(
      { guildId },
      { $set: { prefix: newPrefix } },
      { upsert: true, new: true },
    );

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('✅ Prefix Updated')
      .setDescription(`The prefix for this server has been set to \`${newPrefix}\`\n\nExample: \`${newPrefix}balance\`, \`${newPrefix}daily\``)
      .setFooter({ text: '🌌 Nebula Bot • Prefix Settings' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
