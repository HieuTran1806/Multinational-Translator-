import { useEffect, useState } from 'react';
import { narration, type NarrationState } from './narrationController';

export function useNarrationState(): NarrationState {
  const [s, setS] = useState<NarrationState>(narration.getState());
  useEffect(() => narration.subscribe(setS), []);
  return s;
}
