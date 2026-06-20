const prefixHandler = require('./prefixHandler');
const GuildSettings = require('./GuildSettings');
const config = require('./config');

const DEFAULT_PREFIX = config.lottery?.defaultPrefix ?? 'n!';

const ALIASES = {
  lotto: 'lottery',
  bal:   'balance',
  dep:   'deposit',
  with:  'withdraw',
  inv:   'inventory',
  prof:  'profile',
};

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    let prefix = DEFAULT_PREFIX;
    try {
      const settings = await GuildSettings.findOne({ guildId: message.guild.id });
      if (settings?.prefix) prefix = settings.prefix;
    } catch {}

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const rawName = args.shift().toLowerCase();
    const commandName = ALIASES[rawName] ?? rawName;

    const command = client.commands.get(commandName);
    if (!command) return;

    await prefixHandler.execute(message, command, args);
  },
};
