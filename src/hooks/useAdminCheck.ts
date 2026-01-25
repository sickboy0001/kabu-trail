import { useState, useEffect } from "react";

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/is-admin");
        if (res.ok) {
          const json = await res.json();
          if (mounted) setIsAdmin(Boolean(json?.isAdmin));
        }
      } catch (err) {
        console.error("Failed to check admin status", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { isAdmin, loading };
}
