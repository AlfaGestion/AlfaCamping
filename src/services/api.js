import Toast from "react-native-toast-message";

export async function getApiConfig(configDb) {  
  const response = await configDb.fetchConfig();
  
  let API_URI = response.find(item => item.clave === "api_uri")?.valor
  const ALFA_ACCOUNT = response.find(item => item.clave === "customer_id")?.valor
  const PASSWORD_SYNC = response.find(item => item.clave === "password")?.valor
  const USERNAME_SYNC = response.find(item => item.clave === "username")?.valor
  const ALFA_DATABASE_ID = response.find(item => item.clave === "database_id")?.valor

  if (!API_URI) {
    const envApi = process.env.EXPO_PUBLIC_API_URI;
    if (envApi) {
      API_URI = envApi;
      await configDb.setConfigValue("api_uri", envApi);
    }
  }

  return [API_URI, ALFA_ACCOUNT, PASSWORD_SYNC, USERNAME_SYNC, ALFA_DATABASE_ID];
}

export const setDataToApi = async (configDb, endpoint, payload) => {
  const [response] = await configDb.getConfigValue("TOKEN");

  let TOKEN = response?.valor;

  if (!TOKEN) {
    //Obtener el token para sincronizar
    const dataToken = await getToken(configDb);
    if (dataToken.status_code == 200) {
      TOKEN = dataToken.token;
    } else {
      return dataToken; //ES ERROR RESPONSE
    }
  }

  // console.log('TOKEN AAAAAA', TOKEN);

  let data = await Post(configDb, endpoint, JSON.stringify(payload), TOKEN);

  //EL TOKEN SE VENCIO
  if (data.status_code == 401) {
    const dataToken = await getToken(configDb);

    if (dataToken.status_code == 200) {
      TOKEN = dataToken.token;
    } else {
      return dataToken; //ES ERROR RESPONSE
    }

    //REPITO LA PETICION
    data = await Post(configDb, endpoint, JSON.stringify(payload), TOKEN);

    if (data.status_code == 401) {
      return errorResponse("No se pudo obtener el token. Intente nuevamente");
    }
  }

  return data;
};

export const getDataFromAPI = async (configDb, endpoint, payload = null, method = "GET") => {
  const [response] = await configDb.getConfigValue("TOKEN");

  let TOKEN = response?.valor;

  if (TOKEN == "") {
    //Obtener el token para sincronizar
    const dataToken = await getToken(configDb);

    if (dataToken.status_code == 200) {
      TOKEN = dataToken.token;
    } else {
      // console.log('dataToken', dataToken);
      return dataToken; //ES ERROR RESPONSE
    }
  }

  let data;
  if (method == "GET") {
    data = await Get(configDb, endpoint, TOKEN);
  } else {
    data = await Post(configDb, endpoint, JSON.stringify(payload), TOKEN, "query");
  }

  //EL TOKEN SE VENCIO
  if (data.status_code == 401) {
    const dataToken = await getToken(configDb);

    if (dataToken.status_code == 200) {
      TOKEN = dataToken.token;
    } else {
      return dataToken; //ES ERROR RESPONSE
    }

    //REPITO LA PETICION
    if (method == "GET") {
      data = await Get(configDb, endpoint, TOKEN);
    } else {
      data = await Post(configDb, endpoint, JSON.stringify(payload), TOKEN, "query");
    }

    if (data.status_code == 401) {
      Toast.show({
        type: "error",
        text1: "No se pudo obtener el token",
        text2: "Intente nuevamente.",
        position: "bottom",
        bottomOffset: 120,
        visibilityTime: 2999,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 15 },
        autoHide: true,
      });

      return errorResponse("No se pudo obtener el token. Intente nuevamente");
    }
  }

  return data;
};

export const getToken = async (configDb) => {  
  const [API_URI, ALFA_ACCOUNT, PASSWORD_SYNC, USERNAME_SYNC, ALFA_DATABASE_ID] = await getApiConfig(configDb);

 const payload = {
    type: "s",
    alfaCustomerId: ALFA_ACCOUNT.trim(),
    username: USERNAME_SYNC.trim(),
    password: PASSWORD_SYNC.trim(),
    databaseId: ALFA_DATABASE_ID,
  };

  const dataToken = await Post(configDb, "login", JSON.stringify(payload), type="query");

  if (dataToken.token != "" && dataToken.token != null && dataToken.token != undefined) {

    // console.log('settingConfig', dataToken.token.trim());
    
    await configDb.setConfigValue("TOKEN", dataToken.token.trim());
    return { status_code: 200, token: dataToken.token.trim() };

  } else {
    Toast.show({
      type: "error",
      text1: "Error al obtener el token",
      text2: "Verifique los datos de conexión.",
      position: "bottom",
      bottomOffset: 120,
      visibilityTime: 2999,
      text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
      text2Style: { fontFamily: "Poppins-Regular", fontSize: 15 },
      autoHide: true,
    });

    return errorResponse("Verifique los datos de conexión.");
  }
};

export const Get = async (configDb, uri, token = "") => {
  const [API_URI] = await getApiConfig(configDb);

  try {
    let headers = {};
    if (token != "") {
      headers = {
        Authorization: `Bearer ${token}`,
      };
    } else {
      headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(`${API_URI}${uri}`, {
      method: "GET",
      headers: headers,
    });

    let data = await response.json();

    return data;
  } catch (error) {
    // console.error("GET ERROR", error);

    Toast.show({
      type: "error",
      text1: "Error al obtener los datos",
      text2: `${error}`,
      position: "bottom",
      bottomOffset: 120,
      visibilityTime: 2999,
      text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
      text2Style: { fontFamily: "Poppins-Regular", fontSize: 15 },
      autoHide: true,
    });

    return errorResponse(error);
  }
};

export const Post = async (configDb, uri, payload, token = "", type = "upload") => {
  const [API_URI] = await getApiConfig(configDb);

  try {
    let headers = {};

    if (token != "") {
      headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
    } else {
      headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(`${API_URI}${uri}`, {
      method: "POST",
      body: payload,
      headers: headers,
    });

    let data = await response.json();
    return data;
  } catch (error) {
    // console.error("POST ERROR:", error);
    
    Toast.show({
      type: "error",
      text1: type == "query" ? "Error al obtener los datos" : "Error al grabar los datos",
      text2: `${error}`,
      position: "bottom",
      bottomOffset: 120,
      visibilityTime: 2999,
      text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
      text2Style: { fontFamily: "Poppins-Regular", fontSize: 15 },
      autoHide: true,
    });

    return errorResponse(error);
  }
};

const errorResponse = (message) => {
  return {
    error: true,
    status_code: 404,
    message: `Error: ${message}`,
    data: [],
  };
};
