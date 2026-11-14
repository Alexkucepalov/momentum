import { useEffect } from 'react';

import { GarminSyncBanner } from '@/src/components/GarminSyncBanner';
import { useGarminAutoSync } from '@/src/features/garmin/useGarminAutoSync';
import { useData } from '@/src/state/DataContext';

/** Mount once under DataProvider — autosync + slim status banner. */
export function GarminAutoSyncHost() {
  const { repo, refresh, showFlash } = useData();
  const { running, lastNote, lastWasError } = useGarminAutoSync(repo, refresh);

  useEffect(() => {
    if (!lastNote || running) return;
    if (lastWasError) showFlash(lastNote);
  }, [lastNote, lastWasError, running, showFlash]);

  return <GarminSyncBanner running={running} note={null} />;
}
