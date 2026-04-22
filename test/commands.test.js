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
