const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('./database');
const { formatTime, randomInt } = require('./embed');
const config = require('./config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('🌌 Claim your weekly galactic reward package'),

  cooldown: 3,

  async execute(interaction) {
    try {
      const user = await getUser(interaction.user.id);
      const now = Date.now();
      const cooldown = config.economy.weeklyCooldown;

      if (user.weeklyCooldown && now - user.weeklyCooldown < cooldown) {
        const remaining = cooldown - (now - user.weeklyCooldown);

        const cooldownEmbed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('⏳ Weekly Already Claimed')
          .setDescription(
            `The galactic supply ship hasn't arrived yet!\nReturn in **${formatTime(remaining)}**.`
          )
          .setFooter({ text: '🌌 Nebula Bot' })
          .setTimestamp();

        return await interaction.reply({
          embeds: [cooldownEmbed],
          ephemeral: true,
        });
      }

      const amount = randomInt(
        config.economy.weeklyMin,
        config.economy.weeklyMax
      );

      const darkMatter = randomInt(1, 5);

      user.wallet += amount;
      user.darkMatter += darkMatter;
      user.weeklyCooldown = now;

      await user.save();

      const rewardEmbed = new EmbedBuilder()
        .setColor(config.colors.nebula)
        .setTitle('🚀 Weekly Galactic Reward Claimed!')
        .setDescription(
          'The galactic supply ship has delivered your weekly package!'
        )
        .addFields(
          {
            name: '☄️ Cosmic Credits',
            value: `**${amount.toLocaleString()}** Credits`,
            inline: true,
          },
          {
            name: '🌌 Dark Matter',
            value: `**${darkMatter}** Dark Matter`,
            inline: true,
          },
          {
            name: '👛 New Balance',
            value: `**${user.wallet.toLocaleString()}** Credits`,
            inline: true,
          }
        )
        .setFooter({
          text: '🌌 Nebula Bot • Come back in 7 days!',
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [rewardEmbed],
      });
    } catch (error) {
      console.error('Weekly Command Error:', error);

      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ An error occurred while executing this command.',
          ephemeral: true,
        });
      }
    }
  },
};
