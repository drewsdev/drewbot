# drewbot

Node.js Discord bot scaffolded to follow the same core flow as the
[discord-example-app](https://github.com/discord/discord-example-app.git),
including command registration and interaction handling.

## Setup

```bash
# navigate to directory
cd drewbot

# install dependencies
npm install
```

Copy `.env.example` to `.env` and configure:

- `DISCORD_TOKEN` - bot token
- `DISCORD_APPLICATION_ID` - app/client ID
- `DISCORD_GUILD_ID` - test guild for guild command registration

## Register commands

This project includes a mix of **user install** and **guild install** commands:

- `ping` - guild install only
- `hello` - user install only
- `about` - both user and guild install

Register commands globally:

```bash
npm run register:global
```

Register guild commands for fast testing:

```bash
npm run register:guild
```

## Music command

The `music` command is guild-only and supports:

- `play query` - queue a YouTube or SoundCloud URL, or search text
- `queue` - show the current track and upcoming queue
- `skip` - skip the current track
- `autoplay` - toggle related-track autoplay for the guild
- `stop` - clear the queue and disconnect

## Run bot

```bash
npm start
```

## Getting started docs

- https://discord.com/developers/docs/quick-start/getting-started
