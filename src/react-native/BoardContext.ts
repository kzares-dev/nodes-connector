import { createContext, useContext } from "react";
import type { NativeBoardContextValue } from "./types";

export const NativeBoardContext = createContext<NativeBoardContextValue | null>(null);

export function useNativeBoard(): NativeBoardContextValue {
  const context = useContext(NativeBoardContext);

  if (!context) {
    throw new Error("useNativeBoard must be used inside <Board />.");
  }

  return context;
}

export const useBoard = useNativeBoard;
