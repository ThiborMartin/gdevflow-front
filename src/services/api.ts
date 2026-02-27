import axios from "axios";

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