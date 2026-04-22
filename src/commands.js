export const INSTALL_TYPES = {
  GUILD_INSTALL: 0,
  USER_INSTALL: 1,
};

export const INTERACTION_CONTEXTS = {
  GUILD: 0,
  BOT_DM: 1,
  PRIVATE_CHANNEL: 2,
};

export const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong from a guild-install command.',
    type: 1,
    integration_types: [INSTALL_TYPES.GUILD_INSTALL],
    contexts: [INTERACTION_CONTEXTS.GUILD],
  },
  {
    name: 'hello',
    description: 'Replies in DMs from a user-install command.',
    type: 1,
    integration_types: [INSTALL_TYPES.USER_INSTALL],
    contexts: [INTERACTION_CONTEXTS.BOT_DM, INTERACTION_CONTEXTS.PRIVATE_CHANNEL],
  },
  {
    name: 'about',
    description: 'Shows details about where this command is running.',
    type: 1,
    integration_types: [INSTALL_TYPES.GUILD_INSTALL, INSTALL_TYPES.USER_INSTALL],
    contexts: [
      INTERACTION_CONTEXTS.GUILD,
      INTERACTION_CONTEXTS.BOT_DM,
      INTERACTION_CONTEXTS.PRIVATE_CHANNEL,
    ],
  },
  {
    name: 'weather',
    description: 'Get current weather for an area.',
    type: 1,
    integration_types: [INSTALL_TYPES.USER_INSTALL],
    contexts: [
      INTERACTION_CONTEXTS.GUILD,
      INTERACTION_CONTEXTS.BOT_DM,
      INTERACTION_CONTEXTS.PRIVATE_CHANNEL,
    ],
    options: [
      {
        name: 'area',
        description: 'City or area to search (for example: Seattle or London).',
        type: 3,
        required: true,
      },
    ],
  },
];
