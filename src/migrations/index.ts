import * as migration_20261117_160648_initial from './20261117_160648_initial'
import * as migration_20261117_224346_payload_3_94 from './20261117_224346_payload_3_94'
import * as migration_20261118_090000_bio_sandrine from './20261118_090000_bio_sandrine'
import * as migration_20261118_100000_intertitres from './20261118_100000_intertitres'

export const migrations = [
  {
    up: migration_20261117_160648_initial.up,
    down: migration_20261117_160648_initial.down,
    name: '20261117_160648_initial',
  },
  {
    up: migration_20261117_224346_payload_3_94.up,
    down: migration_20261117_224346_payload_3_94.down,
    name: '20261117_224346_payload_3_94',
  },
  {
    up: migration_20261118_090000_bio_sandrine.up,
    down: migration_20261118_090000_bio_sandrine.down,
    name: '20261118_090000_bio_sandrine',
  },
  {
    up: migration_20261118_100000_intertitres.up,
    down: migration_20261118_100000_intertitres.down,
    name: '20261118_100000_intertitres',
  },
]
