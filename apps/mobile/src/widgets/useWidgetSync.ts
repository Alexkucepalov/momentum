import { useEffect } from 'react';

import { useData } from '@/src/state/DataContext';
import { syncTodayWidgetPayload } from './syncTodayWidget';

/** Keep Android home widget JSON in sync after diary/activity changes. */
export function useWidgetSync() {
  const { repo, revision } = useData();
  useEffect(() => {
    void syncTodayWidgetPayload(repo);
  }, [repo, revision]);
}
