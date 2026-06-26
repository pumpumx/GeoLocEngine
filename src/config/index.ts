

import nconf from 'nconf';
import path from 'path'
import { IMongoDb, IServer } from '../typings/config.js';


const env = process.env.NODE_ENV || 'development'
const isProduction = env === 'development' ? false : true
const configPath = !isProduction ? `src/config/config.${env}.json` : `dist/config/config.${env}.json`
nconf.argv().env().file({ file: configPath});

export const NODE_ENV:string = env;
export const PORT = (nconf.get('server') as IServer).port

export const logDir = '../../logs'

export const mongoURI = (nconf.get('mongodb') as IMongoDb).mongo_uri



