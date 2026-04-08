import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const TOKEN_STORAGE_KEY = "@gdevflow:token";

//Pega a URL da API das variáveis de ambiente
const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.warn("EXPO_PUBLIC_API_URL não definida. Crie um arquivo .env na raiz do projeto.");
}

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
