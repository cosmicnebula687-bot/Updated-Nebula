const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('./database');
const { randomInt } = require('./embed');
const config = require('./config');

const EXPEDITIONS = [
  {
    name: 'Deep Space Survey',
    emoji: '🔭',
    duration: '6 hours',
    cooldown: 6 * 60 * 60 * 1000,
    reward: { min: 3000, max: 8000 },
    xp: 150
  },
  {
    name: 'Black Hole Mapping',
    emoji: '🌑',
    duration: '12 hours',
    cooldown: 12 * 60 * 60 * 1000,
    reward: { min: 8000, max: 20000 },
    xp: 300
  },
  {
    name: 'Galactic Core Run',
    emoji: '🌌',
    duration: '24 hours',
    cooldown: 24 * 60 * 60 * 1000,
    reward: { min: 20000, max: 50000 },
    xp: 600
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spaceexpedition')
    .setDescription('🚀 Launch a long expedition for massive rewards')
    .addStringOption(opt =>
      opt
        .setName('mission')
        .setDescription('Expedition to launch')
        .setRequired(true)
        .addChoices(
          ...EXPEDITIONS.map(e => ({
            name: `${e.emoji} ${e.name} (${e.duration})`,
            value: e.name,
          }))
        )
    ),

  cooldown: 0,

  async execute(interaction) {
    const missionName = interaction.options.getString('mission');
    const expedition = EXPEDITIONS.find(e => e.name === missionName);
    const user = await getUser(interaction.user.id);

    // MongoDB cooldown check
    if (
      user.spaceExpeditionCooldown &&
      user.spaceExpeditionCooldown > Date.now()
    ) {
      const remaining = user.spaceExpeditionCooldown - Date.now();

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);

      return interaction.reply({
        content: `⏳ Your expedition fleet is still away.\nReturn in **${hours}h ${minutes}m**.`,
        ephemeral: true,
      });
    }

    // Set cooldown based on selected mission
    user.spaceExpeditionCooldown = Date.now() + expedition.cooldown;

    const success = Math.random() > 0.2;

    if (success) {
      const reward = randomInt(
        expedition.reward.min,
        expedition.reward.max
      );

      user.wallet += reward;
      user.xp += expedition.xp;
      user.spaceStats.expeditionsCompleted++;

      await user.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.gold)
            .setTitle(
              `🚀 Expedition Complete — ${expedition.emoji} ${expedition.name}`
            )
            .setDescription(
              'Your crew returned victorious after a long journey!'
            )
            .addFields(
              {
                name: '💰 Earned',
                value: `☄️ **${reward.toLocaleString()}** Credits`,
                inline: true,
              },
              {
                name: '✨ XP',
                value: `+**${expedition.xp}** XP`,
                inline: true,
              },
              {
                name: '🚀 Expeditions',
                value: `**${user.spaceStats.expeditionsCompleted}**`,
                inline: true,
              }
            )
            .setFooter({ text: '🌌 Nebula Bot' })
            .setTimestamp(),
        ],
      });
    }

    const loss = randomInt(500, 2000);

    user.wallet = Math.max(0, user.wallet - loss);

    await user.save();

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle(`🚀 Expedition Failed — ${expedition.name}`)
          .setDescription(
            'Your ship suffered critical damage and was forced to return.'
          )
          .addFields({
            name: '💸 Repair Cost',
            value: `☄️ **${loss.toLocaleString()}** Credits`,
            inline: true,
          })
          .setFooter({ text: '🌌 Nebula Bot' })
          .setTimestamp(),
      ],
    });
  },
};
