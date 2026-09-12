import { Redirect } from 'expo-router';
/** OAuth redirect target; the session is parsed in authService before we land here. */
export default function AuthCallback() {
  return <Redirect href="/(tabs)/profile" />;
}
