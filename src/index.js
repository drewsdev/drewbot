import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  InteractionContextType,
  Partials,
} from 'discord.js';
import { weatherCommand } from './weather.js';

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

  if (interaction.commandName === 'weather') {
    const area = interaction.options.getString('area', true);
    await weatherCommand(interaction, area);
    return;
  }

  await interaction.reply({ content: 'Unknown command.', ephemeral: true });
});

await client.login(token);
