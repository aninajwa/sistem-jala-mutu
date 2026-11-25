import { useEffect, useState } from "react";
export function useCompact() {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(max-width: 780px)").matches
      : false,
  );
  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 780px)");
    if (!query) return;
    const change = () => setCompact(query.matches);
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return compact;
}
