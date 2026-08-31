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
 * Verified working channels for African countries (Nigeria, Egypt, etc.)
 */
export const VERIFIED_AFRICAN_CHANNELS: IptvChannel[] = [
  // NIGERIA
  {
    id: 'advocate-broadcasting-network-ng',
    name: 'Advocate Broadcasting Network',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/AdvocateBroadcastingNetwork.ng.png',
    m3u8Url: 'https://viewmedia7219.bozztv.com/wmedia/viewmedia100/web_045/Stream/playlist.m3u8',
    epgId: 'AdvocateBroadcastingNetwork.ng',
    type: 'tv',
    category: 'News',
    country: 'Nigeria',
  },
  {
    id: 'channels-tv-ng',
    name: 'Channels TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/ChannelsTV.ng.png',
    m3u8Url: 'https://www.youtube.com/@ChannelsTelevision/live',
    epgId: 'ChannelsTV.ng',
    type: 'tv',
    category: 'News',
    country: 'Nigeria',
  },
  {
    id: 'istage-tv-ng',
    name: 'Itage TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/ItageTV.ng.png',
    m3u8Url: 'https://viewmedia7219.bozztv.com/wmedia/viewmedia100/web_011/Stream/playlist.m3u8',
    epgId: 'ItageTV.ng',
    type: 'tv',
    category: 'Entertainment',
    country: 'Nigeria',
  },
  {
    id: 'news-central-ng',
    name: 'News Central',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/NewsCentral.ng.png',
    m3u8Url: 'https://wf.newscentral.ng:8443/hls/stream.m3u8',
    epgId: 'NewsCentral.ng',
    type: 'tv',
    category: 'News',
    country: 'Nigeria',
  },
  {
    id: 'rave-tv-ng',
    name: 'Rave TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/RaveTV.ng.png',
    m3u8Url: 'https://viewmedia7219.bozztv.com/wmedia/viewmedia100/web_039/Stream/playlist.m3u8',
    epgId: 'RaveTV.ng',
    type: 'tv',
    category: 'General',
    country: 'Nigeria',
  },
  {
    id: 'silverbird-news-24-ng',
    name: 'Silverbird News 24',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/SilverbirdNews24.ng.png',
    m3u8Url: 'https://viewmedia7219.bozztv.com/wmedia/viewmedia100/web_029/Stream/playlist.m3u8',
    epgId: 'SilverbirdNews24.ng',
    type: 'tv',
    category: 'News',
    country: 'Nigeria',
  },
  {
    id: 'soundcity-tv-ng',
    name: 'Soundcity TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/SoundcityTV.ng.png',
    m3u8Url: 'https://www.youtube.com/channel/UCGuIbAVY4_O-KOQmLkU0IKQ/live',
    epgId: 'SoundcityTV.ng',
    type: 'tv',
    category: 'Music',
    country: 'Nigeria',
  },
  {
    id: 'superscreen-tv-ng',
    name: 'Superscreen TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/SuperscreenTV.ng.png',
    m3u8Url: 'https://video1.getstreamhosting.com:1936/8398/8398/playlist.m3u8',
    epgId: 'SuperscreenTV.ng',
    type: 'tv',
    category: 'General',
    country: 'Nigeria',
  },
  {
    id: 'tvc-news-ng',
    name: 'TVC News',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/TVCNews.ng.png',
    m3u8Url: 'https://www.youtube.com/tvcnewsnigeria/live',
    epgId: 'TVCNews.ng',
    type: 'tv',
    category: 'News',
    country: 'Nigeria',
  },
  {
    id: 'waffi-tv-ng',
    name: 'Waffi TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/WaffiTV.ng.png',
    m3u8Url: 'https://oqgdro3xd4rm-hls-live.5centscdn.com/waffiitvstreaminglivetfmediacast/e0885d428bea69e372309657f3bd895f.sdp/playlist.m3u8',
    epgId: 'WaffiTV.ng',
    type: 'tv',
    category: 'General',
    country: 'Nigeria',
  },
  {
    id: 'wazobia-max-tv-nigeria-ng',
    name: 'Wazobia Max TV Nigeria',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/WazobiaMaxTVNigeria.ng.png',
    m3u8Url: 'https://wazobia.live:8333/channel/wmax.m3u8',
    epgId: 'WazobiaMaxTVNigeria.ng',
    type: 'tv',
    category: 'Entertainment',
    country: 'Nigeria',
  },
  {
    id: 'wazobia-max-tv-ph-ng',
    name: 'Wazobia Max TV Port Harcourt',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/WazobiaMaxTVPortHarcourt.ng.png',
    m3u8Url: 'https://wazobia.live:8333/channel/wmaxph.m3u8',
    epgId: 'WazobiaMaxTVPortHarcourt.ng',
    type: 'tv',
    category: 'Entertainment',
    country: 'Nigeria',
  },

  // EGYPT
  {
    id: 'aghapy-tv-eg',
    name: 'Aghapy TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/AghapyTV.eg.png',
    m3u8Url: 'https://5b622f07944df.streamlock.net/aghapy.tv/aghapy.smil/playlist.m3u8',
    epgId: 'AghapyTV.eg',
    type: 'tv',
    category: 'Religious',
    country: 'Egypt',
  },
  {
    id: 'al-ghad-plus-eg',
    name: 'Al Ghad Plus',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/AlGhadPlus.eg.png',
    m3u8Url: 'https://playlist.fasttvcdn.com/pl/ykvm3f2fhokwxqsurp9xcg/alghad-plus/playlist.m3u8',
    epgId: 'AlGhadPlus.eg',
    type: 'tv',
    category: 'News',
    country: 'Egypt',
  },
  {
    id: 'al-ghad-tv-eg',
    name: 'Al Ghad TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/AlGhadTV.eg.png',
    m3u8Url: 'https://eazyvwqssi.erbvr.com/alghadtv/alghadtv.m3u8',
    epgId: 'AlGhadTV.eg',
    type: 'tv',
    category: 'News',
    country: 'Egypt',
  },
  {
    id: 'al-qahera-news-eg',
    name: 'Al Qahera News',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/AlQaheraNews.eg.png',
    m3u8Url: 'https://bcovlive-a.akamaihd.net/d30cbb3350af4cb7a6e05b9eb1bfd850/eu-west-1/6057955906001/playlist.m3u8',
    epgId: 'AlQaheraNews.eg',
    type: 'tv',
    category: 'News',
    country: 'Egypt',
  },
  {
    id: 'alhayat-tv-eg',
    name: 'Alhayat TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/AlhayatTV.eg.png',
    m3u8Url: 'https://cdn3.wowza.com/5/OE5HREpIcEkySlNT/alhayat-live/ngrp:livestream_all/playlist.m3u8',
    epgId: 'AlhayatTV.eg',
    type: 'tv',
    category: 'General',
    country: 'Egypt',
  },
  {
    id: 'coptic-tv-eg',
    name: 'Coptic TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/CopticTV.eg.png',
    m3u8Url: 'https://ctv.icopts.app/CTV/index.fmp4.m3u8',
    epgId: 'CopticTV.eg',
    type: 'tv',
    category: 'Religious',
    country: 'Egypt',
  },
  {
    id: 'huda-tv-eg',
    name: 'Huda TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/HudaTV.eg.png',
    m3u8Url: 'https://cdn.bestream.io:19360/elfaro1/elfaro1.m3u8',
    epgId: 'HudaTV.eg',
    type: 'tv',
    category: 'Religious',
    country: 'Egypt',
  },
  {
    id: 'koogi-tv-eg',
    name: 'Koogi TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/KoogiTV.eg.png',
    m3u8Url: 'https://5d658d7e9f562.streamlock.net/koogi.tv/koogi.smil/playlist.m3u8',
    epgId: 'KoogiTV.eg',
    type: 'tv',
    category: 'Kids',
    country: 'Egypt',
  },
  {
    id: 'mbc-masr-1-eg',
    name: 'MBC Masr 1',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/MBCMasr1.eg.png',
    m3u8Url: 'https://shd-gcp-live.edgenextcdn.net/live/bitmovin-mbc-masr/956eac069c78a35d47245db6cdbb1575/index.m3u8',
    epgId: 'MBCMasr1.eg',
    type: 'tv',
    category: 'General',
    country: 'Egypt',
  },
  {
    id: 'mbc-masr-2-eg',
    name: 'MBC Masr 2',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/MBCMasr2.eg.png',
    m3u8Url: 'https://shd-gcp-live.edgenextcdn.net/live/bitmovin-mbc-masr-2/754931856515075b0aabf0e583495c68/index.m3u8',
    epgId: 'MBCMasr2.eg',
    type: 'tv',
    category: 'General',
    country: 'Egypt',
  },
  {
    id: 'rotana-cinema-eg',
    name: 'Rotana Cinema',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/RotanaCinema.eg.png',
    m3u8Url: 'https://rotana.hibridcdn.net/rotananet/cinemamasr_net-7Y83PP5adWixDF93/playlist.m3u8',
    epgId: 'RotanaCinema.eg',
    type: 'tv',
    category: 'Movies',
    country: 'Egypt',
  },
  {
    id: 'watan-tv-eg',
    name: 'Watan TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/WatanTV.eg.png',
    m3u8Url: 'https://rp.tactivemedia.com/watantv_source/live/playlist.m3u8',
    epgId: 'WatanTV.eg',
    type: 'tv',
    category: 'General',
    country: 'Egypt',
  },
];

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

      const logoPath = logoUrl || (epgId ? `https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/${epgId}.png` : '');

      const slug = (cleanName + '-' + country + '-' + type)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      channels.push({
        id: slug || Math.random().toString(36).substring(2, 9),
        name: cleanName,
        logoUrl: logoPath,
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

  let allChannels: IptvChannel[] = [...VERIFIED_AFRICAN_CHANNELS];

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
