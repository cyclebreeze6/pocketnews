'use client';

import { useMemo } from 'react';
import { Clock, Calendar, Info, Tv, Radio, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import type { IptvChannel, EpgProgram } from '../lib/types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface EpgGuideProps {
  channel: IptvChannel;
  epgPrograms?: EpgProgram[];
  currentProgram?: EpgProgram | null;
}

/**
 * Generates a realistic mock EPG program schedule if no external EPG XML is provided for a channel.
 */
function generateFallbackSchedule(channel: IptvChannel): EpgProgram[] {
  const now = new Date();
  const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1, 0, 0);

  const channelCategory = channel.category || 'General';
  const channelName = channel.name;

  const sampleTitles: Record<string, string[]> = {
    News: [
      `${channelName} Morning Headlines`,
      'Global World Report',
      'Live Breaking News & Analysis',
      'Business & Economy Today',
      'Evening Prime News Hour',
      'Late Night World Bulletin'
    ],
    Entertainment: [
      'Morning Variety Show',
      'Top 10 Music Chart Countdown',
      'Culture & Lifestyle Special',
      'Prime Time Drama Series',
      'Late Night Talk Show',
      'Midnight Movie Spotlight'
    ],
    Music: [
      'Afrobeats Non-Stop Hits',
      'Top 40 Video Countdown',
      'Live Studio Sessions',
      'Classic Hits & Retro Beats',
      'Club Mix Party Hours',
      'Chill Out Night Melodies'
    ],
    Sports: [
      'Morning Sports Desk',
      'Football League Highlights',
      'Match Day Live Preview',
      'Sports Debate & Fan Forum',
      'Nightly Action Replay',
      'World Sports Weekly'
    ],
    General: [
      'Morning Breakfast Magazine',
      'Documentary Hour',
      'Community & People Stories',
      'Evening News & Feature',
      'Special Live Broadcast',
      'Nighttime Retrospective'
    ]
  };

  const titles = sampleTitles[channelCategory] || sampleTitles['General'];
  const programs: EpgProgram[] = [];

  let currentTime = new Date(baseTime);

  for (let i = 0; i < 8; i++) {
    const durationMinutes = [30, 45, 60, 90][i % 4];
    const startTimeSec = Math.floor(currentTime.getTime() / 1000);
    const endTime = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
    const endTimeSec = Math.floor(endTime.getTime() / 1000);

    const title = titles[i % titles.length];

    programs.push({
      title,
      description: `Catch live coverage and exclusive broadcasts on ${channelName}. Stay tuned for comprehensive updates and highlights.`,
      startTime: startTimeSec,
      endTime: endTimeSec,
      genre: channelCategory,
    });

    currentTime = endTime;
  }

  return programs;
}

export function EpgGuide({ channel, epgPrograms, currentProgram }: EpgGuideProps) {
  const schedule = useMemo(() => {
    if (epgPrograms && epgPrograms.length > 0) {
      return epgPrograms;
    }
    return generateFallbackSchedule(channel);
  }, [channel, epgPrograms]);

  const activeProgram = useMemo(() => {
    if (currentProgram) return currentProgram;
    const nowSec = Math.floor(Date.now() / 1000);
    return schedule.find(p => p.startTime <= nowSec && p.endTime >= nowSec) || schedule[0];
  }, [currentProgram, schedule]);

  // Calculate percentage of elapsed time for active program progress bar
  const progressPercent = useMemo(() => {
    if (!activeProgram) return 0;
    const nowSec = Math.floor(Date.now() / 1000);
    const totalDuration = activeProgram.endTime - activeProgram.startTime;
    if (totalDuration <= 0) return 0;

    const elapsed = nowSec - activeProgram.startTime;
    const pct = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    return Math.round(pct);
  }, [activeProgram]);

  const formatTimeStr = (unixSec: number) => {
    try {
      return format(new Date(unixSec * 1000), 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-card/60 backdrop-blur-md overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-cyan-950/40 via-background to-background border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          <h3 className="font-bold text-sm tracking-wide font-headline flex items-center gap-1.5">
            Electronic Program Guide (EPG)
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
          Live Schedule
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        {/* Now Airing Banner */}
        {activeProgram && (
          <div className="relative p-4 rounded-xl bg-gradient-to-br from-cyan-950/30 to-background border border-cyan-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Now Playing</span>
              </div>
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>{formatTimeStr(activeProgram.startTime)} - {formatTimeStr(activeProgram.endTime)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-foreground font-headline leading-snug">
                {activeProgram.title}
              </h4>
              {activeProgram.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {activeProgram.description}
                </p>
              )}
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>{progressPercent}% Complete</span>
                <span>{formatTimeStr(activeProgram.endTime)}</span>
              </div>
              <div className="h-1.5 w-full bg-cyan-950/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Schedule Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            Upcoming Programs
          </h4>

          <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden bg-background/50">
            {schedule.slice(0, 6).map((prog, idx) => {
              const isCurrent = prog.title === activeProgram?.title;
              return (
                <div 
                  key={idx}
                  className={cn(
                    'p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 transition-colors hover:bg-accent/40',
                    isCurrent && 'bg-cyan-950/20 border-l-2 border-l-cyan-400'
                  )}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="min-w-[85px] text-xs font-bold text-cyan-400/90 whitespace-nowrap pt-0.5 sm:pt-0">
                      {formatTimeStr(prog.startTime)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-semibold', isCurrent ? 'text-cyan-300 font-bold' : 'text-foreground')}>
                          {prog.title}
                        </span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 bg-cyan-400/20 text-cyan-300 border-cyan-400/40">
                            ON AIR
                          </Badge>
                        )}
                      </div>
                      {prog.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {prog.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {prog.genre && (
                    <Badge variant="secondary" className="text-[10px] self-start sm:self-center font-normal text-muted-foreground bg-muted/60">
                      {prog.genre}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
