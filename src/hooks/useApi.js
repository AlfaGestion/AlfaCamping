import { useConfigDb } from "@/db/useConfigDb";
import { getApiConfig, setDataToApi, getDataFromAPI, getToken } from "@/services/api";

export function useApi() {
  const configDb = useConfigDb();

  const fetchApiConfig = async () => {
    const config = await getApiConfig(configDb);
    console.info('fetchApiConfig:', config);
    return config;
  };

  const sendDataToApi = async (endpoint, payload) => {
    const response = await setDataToApi(configDb, endpoint, payload);
    console.info('sendDataToApi:', response);
    return response;
  };

  const fetchDataFromApi = async (endpoint, payload, method = "GET") => {
    const response = await getDataFromAPI(configDb, endpoint, payload, method);
    // console.info('fetchDataFromApi:', response);
    return response;
  };

  const fetchToken = async () => {
    const response = await getToken(configDb);
    console.info('fetchToken:', response);
    return response;
  };

  return { fetchApiConfig, sendDataToApi, fetchDataFromApi, fetchToken };
}
