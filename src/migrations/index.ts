import * as migration_20261117_160648_initial from './20261117_160648_initial';
import * as migration_20261117_224346_payload_3_94 from './20261117_224346_payload_3_94';

export const migrations = [
  {
    up: migration_20261117_160648_initial.up,
    down: migration_20261117_160648_initial.down,
    name: '20261117_160648_initial',
  },
  {
    up: migration_20261117_224346_payload_3_94.up,
    down: migration_20261117_224346_payload_3_94.down,
    name: '20261117_224346_payload_3_94'
  },
];
