import { IptvConfig } from '../context/IptvContext';

export const buildIptvHeaders = (config: IptvConfig | null | undefined): Record<string, string> => {
  if (!config) return {} as Record<string, string>;
  return {
    'X-IPTV-Base-URL': String(config.baseUrl || ''),
    'X-IPTV-Username': String(config.username || ''),
    'X-IPTV-Password': String(config.password || ''),
    'X-IPTV-Profile': String(config.name || ''),
    'X-IPTV-Portal': 'xtream',
  } as Record<string, string>;
};

