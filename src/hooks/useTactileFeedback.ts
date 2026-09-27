'use client';
import { useCallback } from 'react';
import { useClickSound } from './useClickSound';
import { vibrate } from '@/lib/vibrate';

interface TriggerOptions {
  sound?: boolean;
  vibration?: number | number[] | false;
  frequency?: number;
}

export function useTactileFeedback() {
  
  const playSound = useClickSound();

   const trigger = useCallback(
    async (options: TriggerOptions = {}) => {
      const { sound = true, vibration = 15, frequency = 880 } = options;
      if (sound) await playSound(frequency);
      if (vibration !== false) vibrate(vibration);
    },
    [playSound]
  );

  return trigger;
}