const { errorEmbed } = require('./embed');

function buildOptions(args, message) {
  let argIndex = 0;
  let subcommandConsumed = false;

  return {
    getSubcommand(required = true) {
      subcommandConsumed = true;
      argIndex = 1;
      return args[0] || null;
    },
    getUser(name, required = false) {
      return message.mentions.users.first() || null;
    },
    getMember(name, required = false) {
      return message.mentions.members?.first() || null;
    },
    getChannel(name, required = false) {
      return message.mentions.channels?.first() || null;
    },
    getRole(name, required = false) {
      return message.mentions.roles?.first() || null;
    },
    getString(name, required = false) {
      const val = args[argIndex++];
      return val !== undefined ? val : null;
    },
    getInteger(name, required = false) {
      const val = args[argIndex++];
      if (val === undefined) return null;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? null : parsed;
    },
    getNumber(name, required = false) {
      const val = args[argIndex++];
      if (val === undefined) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    },
    getBoolean(name, required = false) {
      const val = args[argIndex++];
      if (val === undefined) return null;
      return val.toLowerCase() === 'true' || val === '1' || val === 'yes';
    },
    getFocused() { return ''; },
  };
}

async function execute(message, command, args) {
  let deferMsg = null;
  let replied = false;
  let deferred = false;

  const ctx = {
    user: message.author,
    member: message.member,
    guild: message.guild,
    guildId: message.guildId,
    channel: message.channel,
    client: message.client,
    get replied() { return replied; },
    get deferred() { return deferred; },

    async reply(payload) {
      if (replied || deferred) return ctx.followUp(payload);
      replied = true;
      const send = stripEphemeral(payload);
      return message.reply(send).catch(() => message.channel.send(send));
    },

    async followUp(payload) {
      const send = stripEphemeral(payload);
      if (deferMsg) {
        const result = await deferMsg.edit(send).catch(() => message.channel.send(send));
        deferMsg = null;
        return result;
      }
      return message.channel.send(send).catch(() => {});
    },

    async deferReply({ ephemeral } = {}) {
      deferred = true;
      deferMsg = await message.channel.send({ content: '⏳ Processing...' }).catch(() => null);
    },

    async editReply(payload) {
      const send = stripEphemeral(payload);
      if (deferMsg) {
        const result = await deferMsg.edit(send).catch(() => message.channel.send(send));
        deferMsg = null;
        deferred = false;
        replied = true;
        return result;
      }
      if (!replied) {
        replied = true;
        return message.reply(send).catch(() => message.channel.send(send));
      }
    },

    async deleteReply() {},

    options: buildOptions(args, message),

    isChatInputCommand: () => true,
    isAutocomplete: () => false,
  };

  try {
    await command.execute(ctx, message.client);
  } catch (err) {
    console.error(`❌ Error in prefix command ${command.data?.name}:`, err);
    const errPayload = { embeds: [errorEmbed('An error occurred while running this command.')] };
    if (deferMsg) {
      await deferMsg.edit(errPayload).catch(() => {});
    } else if (!replied) {
      await message.reply(errPayload).catch(() => {});
    }
  }
}

function stripEphemeral(payload) {
  if (typeof payload === 'string') return { content: payload };
  const { ephemeral, ...rest } = payload;
  return rest;
}

module.exports = { execute };
