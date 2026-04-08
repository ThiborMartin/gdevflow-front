import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../styles/theme";

interface ScreenStateProps {
  loading?: boolean;
  title: string;
  description?: string;
}

export function ScreenState({ loading, title, description }: ScreenStateProps) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
