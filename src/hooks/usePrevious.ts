import { useEffect, useRef } from "react";

// Este "mini-hook" nos permite saber el valor de un estado en el render anterior
export function usePrevious(value: any) {
  const ref = useRef<any>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
