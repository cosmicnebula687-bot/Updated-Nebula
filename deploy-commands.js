require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

const commandFiles = fs.readdirSync(__dirname)
  .filter(file =>
    file.endsWith('.js') &&
    ![
      'index.js',
      'database.js',
      'config.js',
      'deploy-commands.js',
      'prefixHandler.js',
      'messageCreate.js',
      'lotteryScheduler.js'
    ].includes(file)
  );

for (const file of commandFiles) {
  try {
    const command = require(path.join(__dirname, file));

    if (command.data) {
      commands.push(command.data.toJSON());
    }
  } catch (err) {
    console.log(`❌ Failed to load ${file}:`, err.message);
  }
}

const rest = new REST({ version: '10' })
  .setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} slash commands globally...`);

    const data = await rest.put(
      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),
      { body: commands }
    );

    console.log(`✅ Successfully deployed ${data.length} commands globally!`);
    console.log(
      'Commands:',
      data.map(cmd => `/${cmd.name}`).join(', ')
    );
  } catch (error) {
    console.error('❌ Deploy error:', error);
  }
})();
