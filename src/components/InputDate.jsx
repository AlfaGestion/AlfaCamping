import { newTaskStyles } from "@/styles/TaskStyle";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function InputDate(props) {
  return (
    <View>
      <Text style={[newTaskStyles.label]}>{props.title}</Text>
      <TextInput
        showSoftInputOnFocus={false}
        placeholder={props.placeholder}
        value={props.value ? props.value : ""}
        onFocus={props.callback}
        editable={props.editable || true}
        style={[
          props.fullWidth
            ? [styles.inputDateFullWidth, styles.inputDate]
            : [styles.normalWidth, styles.inputDate],
          newTaskStyles.textInput
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputDate: {
    borderColor: "#e1e1e1",
    borderWidth: 1,
    padding: 10,
  },
  inputDateFullWidth: {
    width: "100%",
  },
  normalWidth: {
    width: 170,
  },
});
