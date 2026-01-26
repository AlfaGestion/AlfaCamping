import { StyleSheet } from "react-native";
import Colors from "./Colors";

const ConfigStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    padding: 15,
    marginTop: 20,
  },
  loader: {
    padding: 30,
  },
  buttonSave: {
    // width: "100%",
    textAlign: "center",
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.DGREEN,
    padding: 10,
  },
  buttonSaveText: {
    color: Colors.WHITE,
    fontSize: 18,
  },
  messageStatus: {
    textAlign: "center",
    marginVertical: 10,
  },
  buttonRestartTables: {
    // width: "100%",
    textAlign: "center",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.RED,
    padding: 10,
  },
  buttonRestartTablesText: {
    color: Colors.WHITE,
    fontSize: 15,
  },
  textDeletingTables: {
    textAlign: "center",
    marginTop: 5,
  },
});

export { ConfigStyles };
