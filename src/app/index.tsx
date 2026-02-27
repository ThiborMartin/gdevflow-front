import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { api } from "../services/api";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadHealth = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/health");

        const text =
          typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data);

        setResult(text);
      } catch (err: any) {
        const message =
          err?.response?.data
            ? `Erro ${err.response.status}: ${JSON.stringify(err.response.data)}`
            : err?.message || "Erro ao acessar a API";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadHealth();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>G Dev Flow</Text>

      <Text style={styles.label}>API_BASE_URL:</Text>
      <Text style={styles.mono}>
        {process.env.EXPO_PUBLIC_API_URL ?? "N/D"}
      </Text>

      <View style={styles.box}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <Text style={styles.label}>Resposta do /health:</Text>
            <Text style={styles.result}>{result}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  label: {
    fontSize: 14,
    opacity: 0.8,
  },
  mono: {
    fontFamily: "monospace",
  },
  box: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  result: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    fontSize: 14,
  },
});