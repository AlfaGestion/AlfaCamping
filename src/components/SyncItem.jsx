import { ActivityIndicator, Image, Text, View } from "react-native";

import iconOk from "@/icons/ok.png";
import { cSyncItemStyles } from "@/styles/SyncStyle";

export default function SyncItem(props) {
  return (
    <View style={[cSyncItemStyles.loaderContainer]}>
      {props.showLoader ? (
        <ActivityIndicator style={[cSyncItemStyles.loader]} size="small" color="#00ff00" />
      ) : (
        <Image style={[cSyncItemStyles.syncOkIcon]} source={iconOk} />
      )}
      <Text style={[cSyncItemStyles.syncText]}>{props.text}</Text>
    </View>
  );
}
