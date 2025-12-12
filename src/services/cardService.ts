import { httpServerUrl } from "./config";

export interface CardResponse {
  card_id: number;
  game_id: number;
  player_id: number;
  type: string;
  name: string;
  picked_up: boolean;
  dropped: boolean;
}

async function getCardsByPlayer(player_id: number): Promise<CardResponse[]> {
  const response = await fetch(
    `${httpServerUrl}/lobby/list/cards/${player_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();

  return data;
}

async function discardAuto(player_id: number): Promise<CardResponse[]> {
  const response = await fetch(`${httpServerUrl}/cards/drop/${player_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail || "Error al descartar la carta automaticamente"
    );
  }
  return response.json();
}

async function discardSelectedList(
  player_id: number,
  card_ids: number[]
): Promise<CardResponse[]> {
  const body = {
    card_ids: card_ids,
  };
  const response = await fetch(
    `${httpServerUrl}/cards/game/drop_list/${player_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail || "Error al descartar la carta seleccionada"
    );
  }
  return response.json();
}

async function drawCard(
  player_id: number,
  game_id: number
): Promise<CardResponse> {
  const response = await fetch(
    `${httpServerUrl}/cards/pick_up/${player_id},${game_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al levantar carta");
  }
  return response.json();
}

async function getDraftPile(gameId: number): Promise<CardResponse[]> {
  const response = await fetch(`${httpServerUrl}/cards/draft/${gameId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data: CardResponse[] = await response.json();
  return data;
}

async function pickUpDraftCard(
  gameId: number,
  cardId: number,
  playerId: number
): Promise<CardResponse> {
  const response = await fetch(
    `${httpServerUrl}/cards/draft_pickup/${gameId},${cardId},${playerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al tomar la carta del draft");
  }

  const data: CardResponse = await response.json();
  return data;
}

export async function pickUpFromDiscard(
  playerId: number,
  cardId: number
): Promise<void> {
  // const url = `${httpServerUrl}/event/look_into_ashes/${playerId},${cardId}`;
  // console.log("URL ENVIADA (PICKUP):", url);
  const response = await fetch(
    `${httpServerUrl}/event/look_into_ashes/${playerId},${cardId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Fallo al robar del descarte: ${errorData.detail}`);
  }
}

const cardService = {
  getCardsByPlayer,
  discardAuto,
  drawCard,
  discardSelectedList,
  getDraftPile,
  pickUpDraftCard,
  pickUpFromDiscard,
};

export default cardService;
