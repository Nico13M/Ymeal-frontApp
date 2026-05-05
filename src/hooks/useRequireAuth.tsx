import { getSession } from "@/src/services/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function useRequireAuth() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const session = await getSession();
        if (!session?.token) {
          router.replace("/connexion");
        }
      } catch (err) {
        try {
          router.replace("/connexion");
        } catch {}
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { checking };
}
