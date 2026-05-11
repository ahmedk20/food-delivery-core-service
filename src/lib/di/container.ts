import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './tokens.js';
import { cacheProvider } from '../cache/init.js';

container.registerInstance(TOKENS.CacheProvider, cacheProvider);

export { container };
