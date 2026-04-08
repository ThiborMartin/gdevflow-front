import { Redirect } from 'expo-router';

export default function CreateProjectRedirect() {
  return <Redirect href="/(drawer)/project-form" />;
}
