import { useState, useEffect } from "react";
import { supabase } from "./supabase";

/** null while checking. Backed by the `is_admin()` database function, so it can't be faked from the browser. */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.rpc("is_admin").then(({ data, error }) => {
      setIsAdmin(!error && data === true);
    });
  }, []);

  return isAdmin;
}
