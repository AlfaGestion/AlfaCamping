import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { newTaskStyles } from "@/styles/TaskStyle";

export default function SelectItem(props) {
  const [textValue, setTextValue] = useState("");

  useEffect(() => {
    if (props?.defaultValue != '') {
      setTextValue(props?.defaultValue)
    }
  }, [])

  return (
    <View style={[newTaskStyles.element]}>
      <Text style={[newTaskStyles.label]}>{props.title}</Text>
      <View>
        <TextInput
          value={props?.reset ? "" : textValue}
          style={[newTaskStyles.textInput]}
          keyboardType={props.keyboardType ? props.keyboardType : "default"}
          placeholder={props.placeholder}
          key={props?.inputKey}
          ref={props?.inputRef}
          onSubmitEditing={props?.onSubmitEditingFn}
          onBlur={props?.onBlurFn}
          returnKeyType={props?.returnKeyType}
          onChangeText={(text) => {
            props.changeTextFn(text);
            setTextValue(text);
          }}
        />
        {!props.hideSuggestions && props.data.length > 0 && (
          <View>
            { props.isLoading && 
              <View style={styles.loaderCentered}>
                <ActivityIndicator size="small" color="#286A73" />
              </View>
            }

            {props.data.map((item, index) => {
              if (!props?.isLoading) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.touchable}
                    onPress={() => {
                      props.saveState(item[props.fieldCode]);
                      setTextValue(item[props.fieldName]);
                      props.resetDataFn([]);
                      if (props.extraFnOnChange) {
                        props.extraFnOnChange();
                      }
                    }}
                  >
                    <Text>{item[props.fieldName]}</Text>
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  picker: {
    width: "100%",
  },
  touchable: {
    borderWidth: 1,
    borderColor: "#28447350",
    padding: 10,
    borderRadius: 5,
  },
  loaderCentered: {
    // width: '100%',
    // height: '70%',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
