import Colors from "@styles/Colors";
import { StyleSheet } from "react-native";

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.WHITE,
  },
  logo: {
    height: 100,
    width: 100,
  },
  title: {
    fontSize: 25,
    marginVertical: 20,
    color: Colors.DGREY,
  },
  inputs: {
    borderWidth: 1,
    borderColor: Colors.GREY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "70%",
    marginVertical: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
    backgroundColor: Colors.DBLUE,
    padding: 18,
    width: "70%",
    borderRadius: 10,
  },
  textButton: {
    textAlign: "center",
    color: Colors.WHITE,
    fontSize: 16,
  },
  textError: {
    fontSize: 15,
    color: Colors.ERROR,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    marginTop: 50,
    color: Colors.DGREY,
  },
});

export { loginStyles };
