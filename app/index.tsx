// app/index.tsx
import { STORAGE_KEYS } from "@/constants/storage";
import { getSession } from "@/src/services/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function StartPage() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const session = await getSession();

        if (!session?.token) {
          if (mounted) setHref("/onboarding");
          return;
        }

        const profileConfig = await AsyncStorage.getItem(STORAGE_KEYS.profileConfig);
        if (mounted) {
          setHref(profileConfig ? "/(tabs)" : "/config-profil");
        }
      } catch {
        if (mounted) setHref("/onboarding");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!href) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF9F2" }}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </View>
    );
  }

  return <Redirect href={href as any} />;
}