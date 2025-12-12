import { httpServerUrl } from "./config";

export interface SecretResponse {
  secret_id: number;
  player_id?: number;
  game_id: number;
  revelated: boolean;
  murderer: boolean;
  accomplice: boolean;
}

async function getSecretsByPlayer(
  player_id: number
): Promise<SecretResponse[]> {
  const response = await fetch(`${httpServerUrl}/lobby/secrets/${player_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  return data;
}

async function revealSecret(secret_id: number): Promise<SecretResponse> {
  const response = await fetch(`${httpServerUrl}/secrets/reveal/${secret_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
}

async function hideSecret(secret_id: number): Promise<SecretResponse> {
  const response = await fetch(`${httpServerUrl}/secrets/hide/${secret_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
}

async function stealSecret(
  secret_id: number,
  player_id: number
): Promise<SecretResponse> {
  const response = await fetch(
    `${httpServerUrl}/secrets/steal/${secret_id},${player_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  return data;
}

const secretService = {
  getSecretsByPlayer,
  revealSecret,
  hideSecret,
  stealSecret,
};

export default secretService;
