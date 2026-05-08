import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: shadow,
});

function MapReady({ onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (typeof onMapReady === "function") onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

function formatFecha(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

function cleanValue(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;

  const clean = String(value).trim();
  return clean !== "" ? clean : fallback;
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
}

export default function AfiMap({ onMapReady, userLocation, points = [] }) {
  const center = [-32.5228, -55.7658];

  return (
    <MapContainer center={center} zoom={6} style={{ height: "560px", width: "100%" }}>
      <MapReady onMapReady={onMapReady} />

      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {points.map((group, idx) => (
          <Marker
            key={`${group.lng}-${group.lat}-${idx}`}
            position={[group.lat, group.lng]}
          >
            <Popup
              className="afi-popup"
              minWidth={220}
              maxWidth={320}
              autoPan
              autoPanPaddingTopLeft={[20, 90]}
              autoPanPaddingBottomRight={[20, 20]}
              keepInView
            >
              <div className="afi-popup-card">
                <div className="afi-popup-header">
                  <strong>
                    {group.count === 1
                      ? "1 persona en esta ubicación"
                      : `${group.count} personas en esta ubicación`}
                  </strong>
                </div>

                <div className="afi-popup-body">
                  {group.items.map((person) => {
                    const esExtranjero =
                      hasValue(person.documentoExtranjero) ||
                      hasValue(person.tipoDocumentoExtranjero);

                    return (
                      <div key={person.cedula} className="afi-popup-person">
                        <div className="afi-popup-name">
                          <strong>
                            {cleanValue(person.primerNombre)} {cleanValue(person.primerApellido)}
                          </strong>
                        </div>

                        {esExtranjero ? (
                          <>
                            <div className="extranjero">
                              Cédula ficticia: {cleanValue(person.cedula)}
                            </div>
                            <div>Fecha nac.: {formatFecha(person.fechaNac)}</div>

                            {hasValue(person.documentoExtranjero) && (
                              <div>
                                Documento extranjero: {cleanValue(person.documentoExtranjero)}
                              </div>
                            )}

                            {hasValue(person.tipoDocumentoExtranjero) && (
                              <div>
                                Tipo documento: {cleanValue(person.tipoDocumentoExtranjero)}
                              </div>
                            )}
                            {hasValue(person.paisExtranjero) && (
                              <div>
                                País: {cleanValue(person.paisExtranjero)}{" "}
                                {person.idPaisExtranjero && (
                                  <span style={{ color: "#888" }}>
                                    ({person.idPaisExtranjero})
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>Cédula: {cleanValue(person.cedula)}</div>
                            <div>Fecha nac.: {formatFecha(person.fechaNac)}</div>
                          </>
                        )}

                        <div>Régimen: {cleanValue(person.asidetalle)}</div>
                        <div>Dirección: {cleanValue(person.direccion)}</div>

                        <div>
                          Teléfono:{" "}
                          {cleanValue(person.telefono, "No tiene / consultar a Comercial")}
                        </div>

                        <div>
                          Celular:{" "}
                          {cleanValue(person.celular, "No tiene / consultar a Comercial")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup
              className="afi-popup"
              minWidth={180}
              maxWidth={260}
              autoPan
              autoPanPaddingTopLeft={[20, 90]}
              autoPanPaddingBottomRight={[20, 20]}
              keepInView
            >
              <div className="afi-popup-card">
                <div className="afi-popup-header">
                  <strong>Mi ubicación</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MarkerClusterGroup>
    </MapContainer>
  );
}