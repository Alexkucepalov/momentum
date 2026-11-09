import { useEffect } from 'react';

import { useData, useAnyRevision } from '@/src/state/DataContext';
import { syncTodayWidgetPayload } from './syncTodayWidget';

/** Keep Android home widget JSON in sync after diary/activity changes. */
export function useWidgetSync() {
  const { repo } = useData();
  const revision = useAnyRevision();
  useEffect(() => {
    void syncTodayWidgetPayload(repo);
  }, [repo, revision]);
}
