// app/index.tsx
import { getSession } from "@/src/services/auth";
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
        if (mounted) {
          setHref("/(tabs)");
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