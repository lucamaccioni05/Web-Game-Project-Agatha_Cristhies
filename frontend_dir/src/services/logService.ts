import { httpServerUrl } from "./config";
import type { LogEntry } from "../context/GameContext"; // Ajusta la ruta

async function registerCancelableEvent(cardId: number): Promise<void> {
  const response = await fetch(`${httpServerUrl}/event/Not_so_fast/${cardId}`, {
    method: "POST",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "No se puede jugar esta carta ahora.");
  }
  return;
}

async function registerCancelableSet(setId: number): Promise<void> {
  const response = await fetch(`${httpServerUrl}/set/Not_so_fast/${setId}`, {
    method: "POST",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "No se puede registrar este set.");
  }
  return;
}

async function getLogs(gameId: number): Promise<LogEntry[]> {
  const response = await fetch(`${httpServerUrl}/logs/${gameId}`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los logs.");
  }
  return await response.json();
}

const logService = {
  registerCancelableEvent,
  registerCancelableSet,
  getLogs,
};

export default logService;
