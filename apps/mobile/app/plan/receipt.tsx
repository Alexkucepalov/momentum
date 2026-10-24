import { type Href, Redirect } from 'expo-router';

/** Removed from product (ADR-009). Use Мои продукты instead of receipt import. */
export default function ReceiptRedirect() {
  return <Redirect href={'/plan/my-products' as Href} />;
}