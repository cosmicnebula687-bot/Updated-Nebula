require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { connectDatabase } = require('./database');

// ─── Anti-Crash System ───────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// ─── Client Setup ─────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
client.cooldowns = new Collection();

// ─── Command Loader ───────────────────────────────────────────────────────────
const commandFiles = fs.readdirSync(__dirname)
  .filter(file =>
    file.endsWith('.js') &&
    ![
      'index.js',
      'database.js',
      'config.js',
      'deploy-commands.js',
      'prefixHandler.js',
      'lotteryScheduler.js',
      'messageCreate.js',
    ].includes(file)
  );

for (const file of commandFiles) {
  try {
    const command = require(path.join(__dirname, file));

    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  } catch (err) {
    console.log(`Failed to load ${file}:`, err.message);
  }
}

console.log(`🚀 Loaded ${client.commands.size} commands`);

// ─── Ready Event ──────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ─── Slash Command Handler ────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`Command not found: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command.',
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command.',
        ephemeral: true,
      });
    }
  }
});

// ─── Prefix Command Handler ───────────────────────────────────────────────────
const messageHandler = require('./messageCreate');
client.on('messageCreate', (message) => messageHandler.execute(message, client));

// ─── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
  await connectDatabase();
  await client.login(process.env.DISCORD_TOKEN);

  // Start lottery scheduler (daily draw at 20:00 UTC)
  const lotteryScheduler = require('./lotteryScheduler');
  lotteryScheduler.start(client);
})();
