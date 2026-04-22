import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands, INSTALL_TYPES } from './commands.js';

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !applicationId || !guildId) {
  throw new Error('Missing DISCORD_TOKEN, DISCORD_APPLICATION_ID, or DISCORD_GUILD_ID in environment.');
}

const guildCommands = commands.filter((command) =>
  command.integration_types.includes(INSTALL_TYPES.GUILD_INSTALL),
);

const rest = new REST({ version: '10' }).setToken(token);

await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
  body: guildCommands,
});

console.log(`Registered ${guildCommands.length} guild commands to ${guildId}.`);
