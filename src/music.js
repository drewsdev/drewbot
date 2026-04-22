import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} from '@discordjs/voice';
import play from 'play-dl';

const sessions = new Map();

function isUrl(value) {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
}

function getVoiceChannel(interaction) {
  return interaction.member?.voice?.channel ?? null;
}

function sourceFromUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('soundcloud.com')) {
      return 'SoundCloud';
    }

    if (parsedUrl.hostname.includes('youtu.be') || parsedUrl.hostname.includes('youtube.com')) {
      return 'YouTube';
    }
  } catch {
    return 'search';
  }

  return 'link';
}

function formatTrack(track) {
  return track?.title ?? track?.url ?? 'Unknown track';
}

function formatQueueMessage(session) {
  const lines = [];

  lines.push(`Autoplay: ${session.autoplay ? 'on' : 'off'}`);

  if (session.currentTrack) {
    lines.push(`Now playing: ${formatTrack(session.currentTrack)}`);
  } else {
    lines.push('Now playing: nothing');
  }

  if (session.queue.length === 0) {
    lines.push('Up next: empty');
    return lines.join('\n');
  }

  const upcoming = session.queue.slice(0, 10).map((track, index) => `${index + 1}. ${formatTrack(track)}`);
  lines.push(`Up next:\n${upcoming.join('\n')}`);

  if (session.queue.length > 10) {
    lines.push(`...and ${session.queue.length - 10} more`);
  }

  return lines.join('\n');
}

function normalizeTrackTitle(track) {
  return track.title ?? track.url;
}

async function resolveTrack(query) {
  if (isUrl(query)) {
    return {
      title: query,
      url: query,
      source: sourceFromUrl(query),
    };
  }

  const results = await play.search(query, { limit: 1 });
  const result = results[0];

  if (!result?.url) {
    return null;
  }

  return {
    title: result.title ?? query,
    url: result.url,
    source: 'search',
  };
}

async function resolveAutoplayTrack(track) {
  const searchResults = await play.search(normalizeTrackTitle(track), { limit: 5 });
  const nextResult = searchResults.find((result) => result?.url && result.url !== track.url);

  if (!nextResult?.url) {
    return null;
  }

  return {
    title: nextResult.title ?? nextResult.url,
    url: nextResult.url,
    source: 'autoplay',
  };
}

function createSession(guildId, voiceChannel) {
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  connection.subscribe(player);

  const session = {
    connection,
    player,
    voiceChannelId: voiceChannel.id,
    queue: [],
    currentTrack: null,
    lastTrack: null,
    autoplay: false,
    advancing: false,
  };

  player.on(AudioPlayerStatus.Idle, () => {
    const currentSession = sessions.get(guildId);

    if (!currentSession || currentSession !== session) {
      return;
    }

    currentSession.lastTrack = currentSession.currentTrack ?? currentSession.lastTrack;
    currentSession.currentTrack = null;

    void advanceQueue(guildId);
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    if (sessions.get(guildId) === session) {
      sessions.delete(guildId);
    }
  });

  return session;
}

async function getSession(guildId, voiceChannel) {
  const existingSession = sessions.get(guildId);

  if (existingSession && existingSession.voiceChannelId !== voiceChannel.id) {
    existingSession.connection.destroy();
    sessions.delete(guildId);
  }

  let session = sessions.get(guildId);

  if (!session) {
    session = createSession(guildId, voiceChannel);
    sessions.set(guildId, session);
    await entersState(session.connection, VoiceConnectionStatus.Ready, 15_000);
  }

  return session;
}

async function advanceQueue(guildId) {
  const session = sessions.get(guildId);

  if (!session || session.advancing) {
    return;
  }

  session.advancing = true;

  try {
    while (sessions.get(guildId) === session) {
      if (session.player.state.status === AudioPlayerStatus.Playing) {
        return;
      }

      const nextTrack = session.queue.shift();

      if (!nextTrack) {
        if (session.autoplay && session.lastTrack) {
          const autoplayTrack = await resolveAutoplayTrack(session.lastTrack);

          if (autoplayTrack) {
            session.queue.push(autoplayTrack);
            continue;
          }
        }

        return;
      }

      let stream;

      try {
        stream = await play.stream(nextTrack.url);
      } catch {
        continue;
      }

      session.currentTrack = nextTrack;
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type ?? StreamType.Arbitrary,
      });

      session.player.play(resource);
      return;
    }
  } finally {
    session.advancing = false;
  }
}

export async function playMusic(interaction, url) {
  const voiceChannel = getVoiceChannel(interaction);

  if (!voiceChannel) {
    await interaction.reply({
      content: 'Join a voice channel first, then run the music command again.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    const track = await resolveTrack(url);

    if (!track) {
      await interaction.editReply('No track was found for that query.');
      return;
    }

    const session = await getSession(interaction.guildId, voiceChannel);
    session.queue.push(track);

    if (session.player.state.status !== AudioPlayerStatus.Playing) {
      await advanceQueue(interaction.guildId);
    }

    await interaction.editReply(`Queued ${formatTrack(track)} from ${track.source}.`);
  } catch {
    await interaction.editReply('That link or search query could not be resolved.');
  }
}

export async function showQueue(interaction) {
  const session = sessions.get(interaction.guildId);

  if (!session) {
    await interaction.reply({ content: 'Nothing is queued right now.', ephemeral: true });
    return;
  }

  await interaction.reply({ content: formatQueueMessage(session), ephemeral: true });
}

export async function skipMusic(interaction) {
  const session = sessions.get(interaction.guildId);

  if (!session || (!session.currentTrack && session.queue.length === 0)) {
    await interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
    return;
  }

  session.player.stop(true);
  await interaction.reply({ content: 'Skipped the current track.', ephemeral: true });
}

export async function autoplayMusic(interaction, enabled) {
  const session = sessions.get(interaction.guildId);

  if (!session) {
    await interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
    return;
  }

  if (typeof enabled === 'boolean') {
    session.autoplay = enabled;
  } else {
    session.autoplay = !session.autoplay;
  }

  await interaction.reply({
    content: `Autoplay is now ${session.autoplay ? 'on' : 'off'}.`,
    ephemeral: true,
  });
}

export async function stopMusic(interaction) {
  const session = sessions.get(interaction.guildId);

  if (!session) {
    await interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
    return;
  }

  session.queue = [];
  session.currentTrack = null;
  session.lastTrack = null;
  session.player.stop(true);
  session.connection.destroy();
  sessions.delete(interaction.guildId);

  await interaction.reply({ content: 'Stopped playback and disconnected from the voice channel.', ephemeral: true });
}
