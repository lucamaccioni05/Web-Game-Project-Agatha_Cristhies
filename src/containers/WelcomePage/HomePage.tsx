import "./HomePage.css";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import destinations from "../../navigation/destinations";
import avatar1 from "../../assets/bart.png";
import avatar2 from "../../assets/nelson.png";
import avatar3 from "../../assets/lisa.png";
import avatar4 from "../../assets/homero.png";
import avatar5 from "../../assets/milhouse.jpeg";
import avatar6 from "../../assets/burns.png";

const AVATARS = [
  { id: "avatar1", src: avatar1, alt: "Avatar 1" },
  { id: "avatar2", src: avatar2, alt: "Avatar 2" },
  { id: "avatar3", src: avatar3, alt: "Avatar 3" },
  { id: "avatar4", src: avatar4, alt: "Avatar 4" },
  { id: "avatar5", src: avatar5, alt: "Avatar 5" },
  { id: "avatar6", src: avatar6, alt: "Avatar 6" },
];

export default function HomePage() {
  const [playerName, setPlayerName] = useState("");
  const [playerDate, setPlayerDate] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  const validate = () => {
    let valid = true;

    setError("");
    setNameError(false);
    setDateError(false);
    setAvatarError(false);

    if (!playerName.trim() && !playerDate && !playerAvatar) {
      setError("Debe ingresar un nombre, fecha de nacimiento y avatar");
      setNameError(true);
      setDateError(true);
      setAvatarError(true);
      valid = false;
    } else if (!playerName.trim() && !playerAvatar) {
      setError("Debe ingresar un nombre y seleccionar un avatar");
      setNameError(true);
      setAvatarError(true);
      valid = false;
    } else if (!playerDate && !playerAvatar) {
      setError("Debe ingresar su fecha de nacimiento y seleccionar un avatar");
      setDateError(true);
      setAvatarError(true);
      valid = false;
    } else if (!playerName.trim() && !playerDate) {
      setError("Debe ingresar su nombre y fecha de nacimiento");
      setNameError(true);
      setDateError(true);
      valid = false;
    } else if (!playerAvatar) {
      setError("Debe elegir un avatar");
      setAvatarError(true);
      valid = false;
    } else if (!playerName) {
      setError("Debe ingresar un nombre");
      setNameError(true);
      valid = false;
    } else if (!playerDate) {
      setError("Debe ingresar su fecha de nacimiento");
      setDateError(true);
      valid = false;
    } else {
      // validación de edad
      const birthDate = new Date(playerDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      if (age < 15) {
        setError("El juego es solo para mayores de 15 años.");
        setDateError(true);
        valid = false;
      }
    }

    return valid;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      navigate(destinations.crearPartida, {
        state: { playerName, playerDate, playerAvatar },
      });
    }
  };

  const handleList = () => {
    if (validate()) {
      navigate(destinations.listarPartidas, {
        state: { playerName, playerDate, playerAvatar },
      });
    }
  };

  return (
    <div className="home-page">
      <form className="form-container">
        <h1 className="form-title">¡Bienvenido!</h1>

        <div className="form-fields-group">
          <div className="form-fields-left">
            {/* Acá metemos el nombre del jugador*/}
            <div className="form-field">
              <label htmlFor="nombre" className="form-label">
                Nombre
              </label>
              <InputField
                id="nombre"
                placeholder="Ingrese su nombre"
                value={playerName}
                maxLength={20}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (e.target.value.trim()) setNameError(false);
                }}
                error={nameError}
              />
            </div>

            {/* Acá metemos el nacimiento del jugador */}
            <div className="form-field">
              <label htmlFor="fecha-nacimiento" className="form-label">
                Fecha de nacimiento
              </label>
              <InputField
                id="fecha-nacimiento"
                type="date"
                placeholder="Ingrese su fecha de nacimiento"
                value={playerDate}
                onChange={(e) => {
                  setPlayerDate(e.target.value);
                  if (e.target.value.trim()) setDateError(false);
                }}
                error={dateError}
              />
            </div>
          </div>

          {/* Acá metemos el avatar del jugador */}
          <div className="form-fields-right">
            <div className="form-field">
              <label htmlFor="avatar" className="form-label">
                Avatar
              </label>
              <div
                className={`avatar-selector ${avatarError ? "error" : ""}`}
                ref={menuRef}
              >
                <button
                  id="avatar"
                  type="button"
                  className="avatar-current"
                  onClick={() => setOpen((o) => !o)}
                  aria-haspopup="true"
                  aria-expanded={open}
                >
                  {playerAvatar ? (
                    <img src={playerAvatar} alt="Avatar seleccionado" />
                  ) : (
                    <span className="avatar-placeholder">Elija</span>
                  )}
                </button>

                {open && (
                  <div className="avatar-menu" role="menu">
                    {AVATARS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="avatar-option"
                        onClick={() => {
                          setPlayerAvatar(a.src);
                          setAvatarError(false);
                          setOpen(false);
                        }}
                        aria-label={a.alt}
                      >
                        <img src={a.src} alt={a.alt} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className={`error-message ${error ? "active" : ""}`}>{error}</p>

        <div className="form-buttons">
          <Button type="button" label="Nueva Partida" onClick={handleCreate} />
          <Button type="button" label="Listar Partidas" onClick={handleList} />
        </div>
      </form>
    </div>
  );
}
