import { Routes, Route } from "react-router-dom";
import destinations from "./navigation/destinations";

import HomePage from "./containers/WelcomePage/HomePage";
import CreatePage from "./containers/CreatePage/CreatePage";
import ListGames from "./containers/ListPage/ListGames";
import Lobby from "./containers/Lobby/Lobby";
import GamePage from "./containers/GamePage/GamePage";
import EndPage from "./containers/EndPage/EndPage";

export default function App() {
  return (
    <Routes>
      {/* Ruta inicial */}
      <Route path={destinations.home} element={<HomePage />} />

      {/* Ruta para crear partida */}
      <Route path={destinations.crearPartida} element={<CreatePage />} />

      {/* Ruta para listar partidas */}
      {<Route path={destinations.listarPartidas} element={<ListGames />} />}

      {/* Ruta para ir al lobby*/}
      {<Route path={destinations.lobby} element={<Lobby />} />}

      {/* Ruta para ir a la partida */}
      {<Route path={destinations.game} element={<GamePage />} />}

      {/* Ruta para ir al fin de la partida */}
      <Route path={destinations.endGame} element={<EndPage />} />
    </Routes>
  );
}
