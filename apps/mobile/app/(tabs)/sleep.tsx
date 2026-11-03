import { Redirect } from 'expo-router';

/**
 * Legacy route: Sleep merged into Movement (activity tab).
 * Keep file so deep links / old hrefs do not 404.
 */
export default function SleepRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/activity', params: { segment: 'sleep' } }} />;
}
