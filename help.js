const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('./config');

const CATEGORIES = [
  {
    emoji: '☄️',
    name: 'Economy',
    commands: [
      '`balance` — View your cosmic wallet',
      '`daily` — Claim daily credits',
      '`weekly` — Claim weekly credits',
      '`work` — Work for credits',
      '`beg` — Beg for spare credits',
      '`deposit` — Deposit to galaxy bank',
      '`withdraw` — Withdraw from bank',
      '`pay` — Pay another user',
      '`gift` — Gift items to a user',
      '`leaderboard` — Top earners',
      '`rob` — Rob another user',
      '`profile` — View your profile',
      '`quest` — Daily quests',
      '`inventory` — View your items',
      '`buy` — Buy from the shop',
      '`sell` — Sell an item',
      '`use` — Use an item',
    ],
  },
  {
    emoji: '🎰',
    name: 'Gambling',
    commands: [
      '`coinflip` — Flip a cosmic coin',
      '`dice` — Roll the galaxy dice',
      '`slots` — Spin the nebula slots',
      '`roulette` — Galactic roulette',
      '`blackjack` — Space blackjack',
      '`crash` — Rocket crash game',
      '`mines` — Asteroid minefield',
      '`higherlower` — Higher or lower',
      '`wheel` — Spin the prize wheel',
      '`luck` — Test your luck',
    ],
  },
  {
    emoji: '⚔️',
    name: 'PvP',
    commands: [
      '`duel` — Challenge a user to a duel',
      '`fight` — Pick a fight',
      '`heist` — Plan a galactic heist',
      '`rob` — Rob another user',
      '`rps` — Rock, paper, scissors',
    ],
  },
  {
    emoji: '🛒',
    name: 'Shop',
    commands: [
      '`shop` — Browse the cosmic shop',
      '`buy` — Purchase an item',
      '`sell` — Sell an item',
      '`inventory` — View your inventory',
      '`use` — Use an item',
    ],
  },
  {
    emoji: '🪐',
    name: 'Space Games',
    commands: [
      '`asteroidmine` — Mine asteroids for ore',
      '`spaceexpedition` — Launch an expedition',
      '`spacefishing` — Fish in nebula clouds',
      '`spacescan` — Scan the cosmos',
      '`planetexplore` — Explore a planet',
      '`terraform` — Terraform a moon',
      '`galaxyraid` — Raid a galaxy',
      '`starforge` — Forge star materials',
      '`alienencounter` — Meet an alien',
      '`meteorhunt` — Hunt meteor showers',
      '`wormhole` — Travel a wormhole',
      '`salvage` — Salvage space debris',
    ],
  },
  {
    emoji: '🛡️',
    name: 'Moderation',
    commands: [
      '`ban` — Ban a user',
      '`kick` — Kick a user',
      '`mute` — Mute a user',
      '`unmute` — Unmute a user',
      '`timeout` — Timeout a user',
      '`untimeout` — Remove timeout',
      '`warn` — Warn a user',
      '`warnings` — View warnings',
      '`clear` — Clear messages',
      '`purge` — Purge messages',
      '`lock` — Lock a channel',
      '`unlock` — Unlock a channel',
      '`slowmode` — Set slowmode',
      '`nickname` — Change nickname',
      '`userinfo` — User information',
      '`serverinfo` — Server information',
      '`roleinfo` — Role information',
    ],
  },
  {
    emoji: '👑',
    name: 'Admin',
    commands: [
      '`add-money` — Add credits to a user',
      '`remove-money` — Remove credits',
      '`set-money` — Set a user\'s balance',
      '`give` — Give items to a user',
      '`economy-reset` — Reset economy',
      '`create-shop-item` — Create a shop item',
      '`delete-shop-item` — Delete a shop item',
      '`add-item` — Add item to inventory',
      '`remove-item` — Remove item from inventory',
      '`embed` — Send a custom embed',
      '`prefix` — Change the bot prefix',
    ],
  },
  {
    emoji: '🎟️',
    name: 'Lottery',
    commands: [
      '`lottery buy` — Buy a cosmic lottery ticket',
      '`lottery info` — View current lottery pool',
      '`lottery leaderboard` — Top lottery winners',
      '`tickets` — View your active tickets',
    ],
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('🌌 View all Nebula commands')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Filter by category')
        .setRequired(false)
        .addChoices(
          { name: '☄️ Economy', value: 'Economy' },
          { name: '🎰 Gambling', value: 'Gambling' },
          { name: '⚔️ PvP', value: 'PvP' },
          { name: '🛒 Shop', value: 'Shop' },
          { name: '🪐 Space Games', value: 'Space Games' },
          { name: '🛡️ Moderation', value: 'Moderation' },
          { name: '👑 Admin', value: 'Admin' },
          { name: '🎟️ Lottery', value: 'Lottery' },
        )),
  cooldown: 3,

  async execute(interaction) {
    const filter = interaction.options.getString('category');

    if (filter) {
      const cat = CATEGORIES.find(c => c.name === filter);
      if (!cat) {
        return interaction.reply({ content: '❌ Category not found.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x7B2FBE)
        .setTitle(`${cat.emoji} ${cat.name} Commands`)
        .setDescription(cat.commands.join('\n'))
        .setFooter({ text: '🌌 Nebula Bot • Use /help to see all categories' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x7B2FBE)
      .setTitle('🌌 Nebula Bot — Command Center')
      .setDescription(
        'Welcome to the **Cosmic Command Center**! 🚀\n' +
        'Use `/help category:<name>` to see commands in a specific category.\n' +
        'Prefix commands also work with `n!<command>`.\n\u200b',
      )
      .setThumbnail('https://i.imgur.com/UzDcUry.png');

    for (const cat of CATEGORIES) {
      embed.addFields({
        name: `${cat.emoji} ${cat.name}`,
        value: `\`/help category:${cat.name}\` — ${cat.commands.length} commands`,
        inline: true,
      });
    }

    embed
      .addFields({ name: '\u200b', value: '**Aliases:** `n!lotto` → `n!lottery` | `n!bal` → `n!balance` | `n!dep` → `n!deposit` | `n!inv` → `n!inventory` | `n!prof` → `n!profile`' })
      .setFooter({ text: '🌌 Nebula Bot • Galaxy Economy & Moderation' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
