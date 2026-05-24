

import nconf from 'nconf';
import path from 'path'


const rootPath = path.
const _env = process.env.ENV || 'development';
nconf.argv().env().file({ file: path.join(, `config.${_env}.json`) });

