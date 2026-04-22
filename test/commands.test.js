import test from 'node:test';
import assert from 'node:assert/strict';
import { commands, INSTALL_TYPES } from '../src/commands.js';

test('includes at least one guild-install and one user-install command', () => {
  const hasGuildInstall = commands.some((command) =>
    command.integration_types.includes(INSTALL_TYPES.GUILD_INSTALL),
  );

  const hasUserInstall = commands.some((command) =>
    command.integration_types.includes(INSTALL_TYPES.USER_INSTALL),
  );

  assert.equal(hasGuildInstall, true);
  assert.equal(hasUserInstall, true);
});

test('all commands include name and description', () => {
  for (const command of commands) {
    assert.ok(command.name);
    assert.ok(command.description);
  }
});

test('weather command is user-install and requires an area option', () => {
  const weatherCommand = commands.find((command) => command.name === 'weather');

  assert.ok(weatherCommand);
  assert.deepEqual(weatherCommand.integration_types, [INSTALL_TYPES.USER_INSTALL]);
  assert.ok(Array.isArray(weatherCommand.options));
  assert.equal(weatherCommand.options[0].name, 'area');
  assert.equal(weatherCommand.options[0].required, true);
test('music command is guild-only and includes queue controls', () => {
  const musicCommand = commands.find((command) => command.name === 'music');

  assert.ok(musicCommand);
  assert.deepEqual(musicCommand.integration_types, [INSTALL_TYPES.GUILD_INSTALL]);
  assert.ok(Array.isArray(musicCommand.options));
  assert.equal(musicCommand.options.length, 5);
  assert.equal(musicCommand.options[0].name, 'play');
  assert.equal(musicCommand.options[0].options[0].name, 'query');
  assert.equal(musicCommand.options[1].name, 'queue');
  assert.equal(musicCommand.options[2].name, 'skip');
  assert.equal(musicCommand.options[3].name, 'autoplay');
  assert.equal(musicCommand.options[4].name, 'stop');
});
