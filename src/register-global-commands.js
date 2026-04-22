import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!token || !applicationId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_APPLICATION_ID in environment.');
}

const rest = new REST({ version: '10' }).setToken(token);

await rest.put(Routes.applicationCommands(applicationId), {
  body: commands,
});

console.log(`Registered ${commands.length} global commands.`);
