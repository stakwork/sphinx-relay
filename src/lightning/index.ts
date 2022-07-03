import { AbstractLightningApi } from './api';
import { LndApi } from './lnd';
import { GreenlightApi } from './greenlight';

import { loadConfig, LightningProvider } from '../utils/config';

const config = loadConfig();

const apis: { [provider in LightningProvider]: typeof AbstractLightningApi } = {
  LND: LndApi,
  GREENLIGHT: GreenlightApi
};

const LightningApi = apis[config.lightning_provider];

// export const lightning = new LightningApi();
export const lightning: AbstractLightningApi = new (<any>LightningApi)(); // TODO fix
