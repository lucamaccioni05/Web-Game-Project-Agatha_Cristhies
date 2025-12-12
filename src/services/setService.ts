import type { CardResponse } from "./cardService";
import { httpServerUrl } from "./config";

export interface SetResponse {
  game_id: number;
  player_id: number;
  set_id: number;
  name: string;
  detective: CardResponse[];
}

async function getSets(player_id: number): Promise<SetResponse[]> {
  const response = await fetch(`${httpServerUrl}/sets/list/${player_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener sets");
  }
  return response.json();
}

async function playSet2(c1_id: number, c2_id: number): Promise<SetResponse> {
  const response = await fetch(`${httpServerUrl}/sets_of2/${c1_id},${c2_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al jugar set");
  }
  return response.json();
}

async function playSet3(
  c1_id: number,
  c2_id: number,
  c3_id: number
): Promise<SetResponse> {
  const response = await fetch(
    `${httpServerUrl}/sets_of3/${c1_id},${c2_id},${c3_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al jugar set");
  }
  return response.json();
}

async function stealSet(
  player_id: number,
  set_id: number
): Promise<SetResponse> {
  const response = await fetch(
    `${httpServerUrl}/sets/steal/${player_id}/${set_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al robar set");
  }
  return response.json();
}

async function addDetective(
  card_id: number,
  set_id: number
): Promise<SetResponse> {
  const response = await fetch(
    `${httpServerUrl}/add/detective/${card_id}/${set_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al agregar detective");
  }
  return response.json();
}

const setService = {
  getSets,
  playSet2,
  playSet3,
  stealSet,
  addDetective,
};

export default setService;
