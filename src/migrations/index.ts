import * as migration_20261117_160648_initial from './20261117_160648_initial';

export const migrations = [
  {
    up: migration_20261117_160648_initial.up,
    down: migration_20261117_160648_initial.down,
    name: '20261117_160648_initial'
  },
];
