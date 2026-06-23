const { errorEmbed } = require('./embed');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Cooldown handling
    const { cooldowns } = client;

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Map());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const remaining = expirationTime - now;

        const days = Math.floor(remaining / 86400000);
        const hours = Math.floor((remaining % 86400000) / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        let timeLeft = '';

        if (days > 0) {
          timeLeft = `${days}d ${hours}h`;
        } else if (hours > 0) {
          timeLeft = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          timeLeft = `${minutes}m ${seconds}s`;
        } else {
          timeLeft = `${seconds}s`;
        }

        return interaction.reply({
          embeds: [
            errorEmbed(
              `⏳ Please wait **${timeLeft}** before using \`/${command.data.name}\` again.`
            ),
          ],
          ephemeral: true,
        });
      }
    }

    timestamps.set(interaction.user.id, now);

    setTimeout(() => {
      timestamps.delete(interaction.user.id);
    }, cooldownAmount);

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error in /${command.data.name}:`, error);

      const reply = {
        embeds: [
          errorEmbed(
            'An error occurred while running this command. The galaxy engineers have been notified.'
          ),
        ],
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
