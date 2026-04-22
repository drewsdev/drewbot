import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  InteractionContextType,
  Partials,
} from 'discord.js';
import {
  autoplayMusic,
  playMusic,
  showQueue,
  skipMusic,
  stopMusic,
} from './music.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('Missing DISCORD_TOKEN in environment.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
    return;
  }

  if (interaction.commandName === 'hello') {
    await interaction.reply(`Hello ${interaction.user.username}!`);
    return;
  }

  if (interaction.commandName === 'about') {
    const context =
      interaction.context === InteractionContextType.Guild
        ? 'guild'
        : interaction.context === InteractionContextType.BotDM
          ? 'bot dm'
          : 'private channel';

    await interaction.reply(`Running in ${context}.`);
    return;
  }

  if (interaction.commandName === 'music') {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'play') {
      const query = interaction.options.getString('query', true);
      await playMusic(interaction, query);
      return;
    }

    if (subcommand === 'queue') {
      await showQueue(interaction);
      return;
    }

    if (subcommand === 'skip') {
      await skipMusic(interaction);
      return;
    }

    if (subcommand === 'autoplay') {
      const enabled = interaction.options.getBoolean('enabled');
      await autoplayMusic(interaction, enabled);
      return;
    }

    if (subcommand === 'stop') {
      await stopMusic(interaction);
      return;
    }

    await interaction.reply({ content: 'Unknown music command.', ephemeral: true });
    return;
  }

  await interaction.reply({ content: 'Unknown command.', ephemeral: true });
});

await client.login(token);
