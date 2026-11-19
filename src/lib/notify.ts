import { Alert, Platform } from "react-native";

/** Alert.alert est sans effet sur react-native-web : on bascule sur window.alert. */
export function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}
