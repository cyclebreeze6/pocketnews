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
export const NIGERIA_IPTV_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/countries/ng.m3u';

/**
 * Verified working channels for Nigeria with logos
 */
export const VERIFIED_NIGERIAN_CHANNELS: IptvChannel[] = [
  {
    id: 'channels-tv-ng',
    name: 'Channels TV',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/ChannelsTV.ng.png',
    m3u8Url: 'https://cs2.push2stream.com/CHANNELSTV-DVR/playlist.m3u8',
    epgId: 'ChannelsTV.ng',
    type: 'tv',
    category: 'News',
    country: 'Nigeria',
  },
  {
    id: 'tvc-news-ng',
    name: 'TVC News',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/TVCNews.ng.png',
    m3u8Url: 'https://tvce.gridpapaservers.com/TVCSEPT/ngrp:myStream_all/playlist.m3u8',
    epgId: 'TVCNews.ng',
    type: 'tv',
    category: 'News',
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
    id: 'nta-international-ng',
    name: 'NTA International',
    logoUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/logos/NTANews24.ng.png',
    m3u8Url: 'https://api.visionip.tv/live/ASHTTP/visiontvuk-entertainment-ntai-hsslive-25f-4x3-MB/playlist.m3u8',
    epgId: 'NTANews24.ng',
    type: 'tv',
    category: 'Culture',
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
    m3u8Url: 'https://cs2.push2stream.com/SOUNDCITY/playlist.m3u8',
    epgId: 'SoundcityTV.ng',
    type: 'tv',
    category: 'Music',
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
    id: 'wap-tv-ng',
    name: 'Wap TV',
    logoUrl: 'https://i.imgur.com/Djng8pI.png',
    m3u8Url: 'https://newproxy3.vidivu.tv/waptv/index.m3u8',
    epgId: 'WapTV.ng',
    type: 'tv',
    category: 'Entertainment',
    country: 'Nigeria',
  },
  {
    id: 'ln247-ng',
    name: 'LN247',
    logoUrl: 'https://i.imgur.com/s6PUehQ.jpg',
    m3u8Url: 'https://go5lmb6oyawb-hls-live.5centscdn.com/station/3dfd3752af3d7aec5c53992c2da3a316.sdp/playlist.m3u8',
    epgId: 'LN247.ng',
    type: 'tv',
    category: 'News',
    country: 'Nigeria',
  },
  {
    id: 'amusic-channel-ng',
    name: 'AMusic Channel',
    logoUrl: 'https://i.imgur.com/06zuf64.png',
    m3u8Url: 'http://mn-nl.mncdn.com/amusictv/amusicsrt.stream/playlist.m3u8',
    epgId: 'AMusicChannel.ng',
    type: 'tv',
    category: 'Music',
    country: 'Nigeria',
  },
  {
    id: 'qausain-tv-ng',
    name: 'Qausain TV',
    logoUrl: 'https://i.ibb.co/N70QyQ7/Qausain-TV-logo.png',
    m3u8Url: 'https://acasmedia3.acangroup.org/qausaintv/qausaintv_output/playlist.m3u8',
    epgId: 'QausainTV.ng',
    type: 'tv',
    category: 'Culture',
    country: 'Nigeria',
  },
  {
    id: 'rapid-tv-ng',
    name: 'Rapid TV',
    logoUrl: 'https://i.imgur.com/FkMNcj1.jpeg',
    m3u8Url: 'https://stream-hls.castr-cdn.com/6a05a899db0ebd344a759542/live_9655bc604f8211f19e748901a3f596d0/index.m3u8',
    epgId: 'RapidTV.ng',
    type: 'tv',
    category: 'General',
    country: 'Nigeria',
  },
];

export const VERIFIED_AFRICAN_CHANNELS: IptvChannel[] = VERIFIED_NIGERIAN_CHANNELS;

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
 * Fetches TV and Radio IPTV channels for Nigeria
 */
export async function fetchTdtChannelsFromSource(): Promise<{ tv: IptvChannel[]; radio: IptvChannel[] }> {
  const [ngRes, freeTvRes] = await Promise.allSettled([
    fetch(NIGERIA_IPTV_PLAYLIST_URL, { next: { revalidate: 3600 } }),
    fetch(FREE_TV_PLAYLIST_URL, { next: { revalidate: 3600 } }),
  ]);

  let allChannels: IptvChannel[] = [...VERIFIED_NIGERIAN_CHANNELS];

  // Parse Nigeria IPTV playlist
  if (ngRes.status === 'fulfilled' && ngRes.value.ok) {
    const ngText = await ngRes.value.text();
    const ngChannels = parseM3uPlaylist(ngText).map(ch => ({
      ...ch,
      country: 'Nigeria',
    }));
    allChannels.push(...ngChannels);
  }

  // Parse Free-TV playlist for Nigerian streams
  if (freeTvRes.status === 'fulfilled' && freeTvRes.value.ok) {
    const freeTvText = await freeTvRes.value.text();
    const freeTvChannels = parseM3uPlaylist(freeTvText);
    const ngFreeTvChannels = freeTvChannels.filter(c =>
      c.country?.toLowerCase() === 'nigeria' ||
      c.country?.toLowerCase() === 'ng' ||
      c.id.endsWith('-ng') ||
      c.epgId?.endsWith('.ng')
    );
    allChannels.push(...ngFreeTvChannels);
  }

  // Filter strictly for Nigerian channels
  const nigerianChannels = allChannels.filter(c =>
    !c.country ||
    c.country.toLowerCase() === 'nigeria' ||
    c.country.toLowerCase() === 'ng' ||
    c.id.endsWith('-ng') ||
    c.epgId?.endsWith('.ng')
  );

  // Deduplicate channels by id or name
  const channelMap = new Map<string, IptvChannel>();
  for (const ch of nigerianChannels) {
    const key = ch.name.toLowerCase().trim();
    if (!channelMap.has(key)) {
      channelMap.set(key, ch);
    }
  }

  const uniqueChannels = Array.from(channelMap.values());
  const tv = uniqueChannels.filter(c => c.type === 'tv');
  const radio = uniqueChannels.filter(c => c.type === 'radio');

  return { tv: tv.length > 0 ? tv : VERIFIED_NIGERIAN_CHANNELS, radio };
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
