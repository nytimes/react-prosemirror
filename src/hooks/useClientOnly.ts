import { useEffect, useState } from "react";

export function useClientOnly() {
  const [render, setRender] = useState(false);
  useEffect(() => {
    setRender(true);
  }, []);
  return render;
}
