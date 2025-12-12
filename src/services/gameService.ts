import type { LogEntry } from "../context/GameContext";
import { httpServerUrl } from "./config";

export interface Game {
  name: string;
  min_players: number;
  max_players: number;
  status: string;
  game_id?: number;
}

export interface GameResponse {
  game_id: number;
  name: string;
  status: string;
  min_players: number;
  max_players: number;
  players_amount: number;
  current_turn: number;
  cards_left: number;
  log: LogEntry[];
  direction_folly: string | null;
}

export interface GameInit {
  game_id: number;
  status: string;
  name: string;
  players_amount: number;
}

async function createGame(game: Game): Promise<GameResponse> {
  const response = await fetch(`${httpServerUrl}/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(game),
  });

  const data = await response.json();
  return data;
}

async function getGames(): Promise<GameResponse[]> {
  const response = await fetch(`${httpServerUrl}/games`, {
    method: "GET",
  });
  const data = await response.json();

  return data;
}

async function startGame(gameId: number): Promise<GameResponse> {
  const response = await fetch(`${httpServerUrl}/game/beginning/${gameId}`, {
    method: "POST",
  });
  const data: GameResponse = await response.json();
  return data;
}

async function getGameById(gameId: number): Promise<GameResponse> {
  const response = await fetch(`${httpServerUrl}/games/${gameId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data: GameResponse = await response.json();
  return data;
}

async function updateTurn(gameId: number): Promise<GameResponse> {
  const response = await fetch(`${httpServerUrl}/game/update_turn/${gameId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data: GameResponse = await response.json();
  return data;
}

const gameService = {
  createGame,
  getGames,
  startGame,
  getGameById,
  updateTurn,
};

export default gameService;
