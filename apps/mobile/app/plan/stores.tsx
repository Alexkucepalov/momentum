import { Redirect } from 'expo-router';

/** Removed from product (ADR-009). Snapshot store prefs soft-retained. */
export default function StoresRedirect() {
  return <Redirect href="/plan" />;
}
