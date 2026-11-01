import { useEffect } from 'react';

import { GarminSyncBanner } from '@/src/components/GarminSyncBanner';
import { useGarminAutoSync } from '@/src/features/garmin/useGarminAutoSync';
import { useData } from '@/src/state/DataContext';

/** Mount once under DataProvider — autosync + slim status banner. */
export function GarminAutoSyncHost() {
  const { repo, refresh, showFlash } = useData();
  const { running, lastNote } = useGarminAutoSync(repo, refresh);

  useEffect(() => {
    if (!lastNote || running) return;
    if (/ошиб|не удался|HTTP/i.test(lastNote)) showFlash(lastNote);
  }, [lastNote, running, showFlash]);

  return <GarminSyncBanner running={running} note={null} />;
}
