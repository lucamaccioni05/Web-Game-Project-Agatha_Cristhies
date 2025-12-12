import type { CardResponse } from "./cardService";
import { httpServerUrl } from "./config";
import type { SecretResponse } from "./secretService";

async function cardsOffTheTable(playerId: number) {
  const response = await fetch(
    `${httpServerUrl}/event/cards_off_table/${playerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al ejecutar Cards Off The Table");
  }

  return await response.json();
}

async function andThenThereWasOneMore(
  newSecretPlayerId: number,
  secretId: number
) {
  const response = await fetch(
    `${httpServerUrl}/event/one_more/${newSecretPlayerId},${secretId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al ejecutar One More Event");
  }

  return await response.json();
}

async function delayEscape(
  gameId: number,
  playerId: number,
  cardIds: number[]
): Promise<any> {
  const response = await fetch(
    `${httpServerUrl}/event/delay_escape/${gameId},${playerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_ids: cardIds,
      }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al ejecutar Delay Escape");
  }
  return await response.json();
}

async function earlyTrainPaddington(
  gameId: number,
  playerId: number
): Promise<any> {
  const response = await fetch(
    `${httpServerUrl}/event/early_train_paddington/${gameId},${playerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail ||
        "Error al ejecutar el evento Early Train to Paddington"
    );
  }

  return await response.json();
}

async function initiateCardTrade(
  trader_id: number,
  tradee_id: number,
  card_id: number
) {
  const response = await fetch(
    `${httpServerUrl}/event/card_trade/initiate/${trader_id},${tradee_id},${card_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al inicializar el card trade");
  }

  return await response.json();
}

async function cardTrade(player_id: number, card_id: number) {
  const response = await fetch(
    `${httpServerUrl}/event/card_trade/select_card/${player_id}/${card_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al finalizar el card trade");
  }

  return await response.json();
}

async function countNSF(gameId: number): Promise<CardResponse> {
  const response = await fetch(
    `${httpServerUrl}/events/count/Not_so_fast/${gameId}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "No se puede jugar esta carta ahora.");
  }

  return response.json();
}

async function pointYourSuspicions(gameId: number) {
  const response = await fetch(
    `${httpServerUrl}/event/point_your_suspicion/${gameId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail || "Error al iniciar Point Your Supicions"
    );
  }
  return await response.json();
}

async function initiateFolly(
  playerId: number,
  gameId: number,
  cardId: number,
  direction: "left" | "right"
): Promise<void> {
  const response = await fetch(
    `${httpServerUrl}/event/dead_card_folly/initiate/${playerId}/${gameId}/${cardId}/${direction}`,
    {
      method: "POST", // Tu backend (event_routes.py) usa POST
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al iniciar Dead Card Folly");
  }
  return;
}

async function follyTrade(
  fromPlayerId: number,
  toPlayerId: number,
  cardId: number
): Promise<void> {
  const response = await fetch(
    `${httpServerUrl}/event/dead_card_folly/select_card/${fromPlayerId}/${toPlayerId}/${cardId}`,
    {
      method: "POST",
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al pasar la carta de Folly");
  }
  return;
}

async function activateBlackmailed(
  playerIdFrom: number,
  playerIdTo: number,
  secretId: number
): Promise<SecretResponse> {
  const response = await fetch(
    `${httpServerUrl}/event/blackmailed/${playerIdFrom},${playerIdTo},${secretId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al activar el chantaje");
  }
  return await response.json();
}

async function deactivateBlackmailed(
  playerIdFrom: number,
  playerIdTo: number
): Promise<void> {
  const response = await fetch(
    `${httpServerUrl}/event/blackmailed/deactivate/${playerIdFrom},${playerIdTo}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al desactivar el chantaje");
  }
}

const eventService = {
  cardsOffTheTable,
  andThenThereWasOneMore,
  delayEscape,
  earlyTrainPaddington,
  pointYourSuspicions,
  initiateCardTrade,
  cardTrade,
  countNSF,
  initiateFolly,
  follyTrade,
  activateBlackmailed,
  deactivateBlackmailed,
};

export default eventService;
