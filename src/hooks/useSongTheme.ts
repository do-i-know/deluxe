'use client';

import { useState, useEffect } from 'react';
import { Song, SongColorTheme } from '@/lib/db/types';
import { extractThemeFromCover, DEFAULT_THEME } from '@/lib/colorExtractor';

export function useSongTheme(song: Song | null): SongColorTheme {
  const [theme, setTheme] = useState<SongColorTheme>(() => {
    if (song?.color_theme) return song.color_theme;
    return DEFAULT_THEME;
  });

  useEffect(() => {
    let isCancelled = false;

    if (!song) {
      setTheme(DEFAULT_THEME);
      return;
    }

    if (song.color_theme) {
      setTheme(song.color_theme);
      return;
    }

    extractThemeFromCover(song.cover_url, song.genre, song.title, song.artist).then((extracted) => {
      if (!isCancelled) {
        setTheme(extracted);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [song?.id, song?.cover_url, song?.title, song?.artist, song?.genre]);

  return theme;
}
