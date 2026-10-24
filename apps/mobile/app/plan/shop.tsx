import { Redirect } from 'expo-router';

/** Removed from product (ADR-009). Snapshot shopping data soft-retained. */
export default function ShopRedirect() {
  return <Redirect href="/plan" />;
}
