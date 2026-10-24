import { Redirect } from 'expo-router';

/** Removed from product (ADR-009). Snapshot budget/expense data soft-retained. */
export default function BudgetRedirect() {
  return <Redirect href="/plan" />;
}
