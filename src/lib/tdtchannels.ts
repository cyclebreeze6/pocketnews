import type { IptvChannel, EpgProgram } from './types';

export interface RawTdtOption {
  format: string;
  url: string;
  res?: string | null;
  lang?: string | null;
}

export interface RawTdtChannel {
  name: string;
  web?: string;
  logo: string;
  epg_id?: string;
  options: RawTdtOption[];
  extra_info?: string[];
}

export interface RawTdtAmbit {
  name: string;
  channels: RawTdtChannel[];
}

export interface RawTdtCountry {
  name: string;
  ambits: RawTdtAmbit[];
}

export interface RawTdtResponse {
  epg?: {
    xml?: string;
    json?: string;
  };
  countries: RawTdtCountry[];
}

export interface RawEpgEvent {
  hi: number; // start time (unix seconds)
  hf: number; // end time (unix seconds)
  t: string;  // title
  d?: string; // description
  g?: string; // genre
  c?: string; // image/caratula
}

export interface RawEpgChannel {
  name: string;
  events: RawEpgEvent[];
}

export const TDT_TV_JSON = 'https://www.tdtchannels.com/lists/tv.json';
export const TDT_RADIO_JSON = 'https://www.tdtchannels.com/lists/radio.json';
export const TDT_EPG_TV_JSON = 'https://www.tdtchannels.com/epg/TV.json';
export const TDT_EPG_RADIO_JSON = 'https://www.tdtchannels.com/epg/RADIO.json';
export const FREE_TV_PLAYLIST_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

/**
 * Parses M3U/M3U8 playlist from Free-TV/IPTV repository into normalized IptvChannel objects
 */
export function parseM3uPlaylist(m3uText: string): IptvChannel[] {
  const lines = m3uText.split('\n');
  const channels: IptvChannel[] = [];
  let currentExtInf: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      currentExtInf = line;
    } else if (line && !line.startsWith('#') && currentExtInf) {
      const streamUrl = line;

      // Extract title after comma
      const nameMatch = currentExtInf.match(/,(.+)$/);
      const nameAttr = currentExtInf.match(/tvg-name="([^"]+)"/);
      const rawName = nameMatch ? nameMatch[1].trim() : (nameAttr ? nameAttr[1] : 'Live Stream');
      const cleanName = rawName.replace(/\s*Ⓢ|\s*Ⓣ|\s*Ⓨ|\s*Ⓖ/g, '').trim();

      const logoMatch = currentExtInf.match(/tvg-logo="([^"]+)"/);
      const logoUrl = logoMatch ? logoMatch[1] : '';

      const epgMatch = currentExtInf.match(/tvg-id="([^"]+)"/);
      const epgId = epgMatch ? epgMatch[1] : '';

      const countryMatch = currentExtInf.match(/tvg-country="([^"]+)"/);
      const groupMatch = currentExtInf.match(/group-title="([^"]+)"/);

      const country = groupMatch ? groupMatch[1].trim() : (countryMatch ? countryMatch[1].trim() : 'Global');
      const category = groupMatch ? groupMatch[1].trim() : 'General';
      const type: 'tv' | 'radio' = (cleanName.toLowerCase().includes('radio') || category.toLowerCase().includes('radio')) ? 'radio' : 'tv';

      const slug = (cleanName + '-' + country + '-' + type)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      channels.push({
        id: slug || Math.random().toString(36).substring(2, 9),
        name: cleanName,
        logoUrl,
        m3u8Url: streamUrl,
        epgId,
        type,
        category,
        country,
      });

      currentExtInf = null;
    }
  }

  return channels;
}

/**
 * Parses a RawTdtResponse into a list of normalized IptvChannel objects
 */
export function parseTdtChannels(data: RawTdtResponse, channelType: 'tv' | 'radio'): IptvChannel[] {
  const result: IptvChannel[] = [];

  if (!data || !Array.isArray(data.countries)) {
    return result;
  }

  for (const country of data.countries) {
    const countryName = country.name || 'Spain';
    if (!Array.isArray(country.ambits)) continue;

    for (const ambit of country.ambits) {
      const categoryName = ambit.name || (channelType === 'tv' ? 'General' : 'Radio');
      if (!Array.isArray(ambit.channels)) continue;

      for (const channel of ambit.channels) {
        const m3u8Option = channel.options?.find(opt => opt.format?.toLowerCase() === 'm3u8' && opt.url) 
          || channel.options?.find(opt => opt.url && opt.url.startsWith('http'));

        if (!m3u8Option || !m3u8Option.url) continue;

        const slug = (channel.name + '-' + categoryName + '-' + channelType)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        result.push({
          id: slug || Math.random().toString(36).substring(2, 9),
          name: channel.name,
          logoUrl: channel.logo || '',
          m3u8Url: m3u8Option.url,
          epgId: channel.epg_id || '',
          type: channelType,
          category: categoryName,
          country: countryName,
          web: channel.web || '',
          extraInfo: channel.extra_info || [],
        });
      }
    }
  }

  return result;
}

/**
 * Fetches all TV and Radio IPTV channels from Free-TV/IPTV and TDTChannels
 */
export async function fetchTdtChannelsFromSource(): Promise<{ tv: IptvChannel[]; radio: IptvChannel[] }> {
  const [freeTvRes, tvRes, radioRes] = await Promise.allSettled([
    fetch(FREE_TV_PLAYLIST_URL, { next: { revalidate: 3600 } }),
    fetch(TDT_TV_JSON, { next: { revalidate: 3600 } }),
    fetch(TDT_RADIO_JSON, { next: { revalidate: 3600 } })
  ]);

  let allChannels: IptvChannel[] = [];

  // Parse Free-TV playlist
  if (freeTvRes.status === 'fulfilled' && freeTvRes.value.ok) {
    const freeTvText = await freeTvRes.value.text();
    const freeTvChannels = parseM3uPlaylist(freeTvText);
    allChannels.push(...freeTvChannels);
  }

  // Parse TDTChannels TV
  if (tvRes.status === 'fulfilled' && tvRes.value.ok) {
    const tvData: RawTdtResponse = await tvRes.value.json();
    const tdtTv = parseTdtChannels(tvData, 'tv');
    allChannels.push(...tdtTv);
  }

  // Parse TDTChannels Radio
  if (radioRes.status === 'fulfilled' && radioRes.value.ok) {
    const radioData: RawTdtResponse = await radioRes.value.json();
    const tdtRadio = parseTdtChannels(radioData, 'radio');
    allChannels.push(...tdtRadio);
  }

  // Deduplicate channels by id
  const channelMap = new Map<string, IptvChannel>();
  for (const ch of allChannels) {
    if (!channelMap.has(ch.id)) {
      channelMap.set(ch.id, ch);
    }
  }

  const uniqueChannels = Array.from(channelMap.values());
  const tv = uniqueChannels.filter(c => c.type === 'tv');
  const radio = uniqueChannels.filter(c => c.type === 'radio');

  return { tv, radio };
}

/**
 * Fetches EPG guide for TV and Radio
 */
export async function fetchTdtEpgFromSource(): Promise<Record<string, EpgProgram[]>> {
  const epgMap: Record<string, EpgProgram[]> = {};

  try {
    const [tvEpgRes, radioEpgRes] = await Promise.allSettled([
      fetch(TDT_EPG_TV_JSON, { next: { revalidate: 1800 } }),
      fetch(TDT_EPG_RADIO_JSON, { next: { revalidate: 1800 } })
    ]);

    const processEpg = async (res: PromiseSettledResult<Response>) => {
      if (res.status === 'fulfilled' && res.value.ok) {
        const rawEpgList: RawEpgChannel[] = await res.value.json();
        for (const item of rawEpgList) {
          if (!item.name || !Array.isArray(item.events)) continue;
          epgMap[item.name] = item.events.map(ev => ({
            title: ev.t,
            description: ev.d,
            startTime: ev.hi,
            endTime: ev.hf,
            genre: ev.g,
            image: ev.c
          }));
        }
      }
    };

    await processEpg(tvEpgRes);
    await processEpg(radioEpgRes);
  } catch (err) {
    console.error('Failed to fetch EPG:', err);
  }

  return epgMap;
}

/**
 * Gets the current active program for an EPG channel ID
 */
export function getCurrentEpgProgram(epgPrograms: EpgProgram[] | undefined): EpgProgram | null {
  if (!epgPrograms || epgPrograms.length === 0) return null;
  const nowSeconds = Math.floor(Date.now() / 1000);

  const current = epgPrograms.find(p => p.startTime <= nowSeconds && p.endTime >= nowSeconds);
  if (current) return current;

  return epgPrograms[0] || null;
}
