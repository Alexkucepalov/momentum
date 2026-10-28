import type { ReactNode } from 'react';

import { SectionTitle } from '@/src/ui/SectionTitle';

/**
 * @deprecated Prefer `SectionTitle` from `@/src/ui`.
 * Compat wrapper — same API, single visual implementation.
 */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return <SectionTitle title={title} action={action} />;
}
