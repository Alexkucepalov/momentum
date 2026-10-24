import { Redirect } from 'expo-router';

/** Removed from product (ADR-009). Snapshot pantry data soft-retained. */
export default function PantryRedirect() {
  return <Redirect href="/plan" />;
}
