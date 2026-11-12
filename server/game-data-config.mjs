import fs from 'node:fs';
import path from 'node:path';

const configPath = path.resolve(process.cwd(), 'game-data.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export const DATA_DRAGON_VERSION = config.dataDragonVersion;
export const DATA_DRAGON_LOCALE = config.locale;
