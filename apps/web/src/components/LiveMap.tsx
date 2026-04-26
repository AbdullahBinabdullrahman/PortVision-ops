"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Map, {
  Marker,
  NavigationControl,
  ScaleControl,
  Popup,
  type StyleSpecification,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";

interface PositionedContainer {
  id: string;
  isoCode: string;
  status: string;
  cargoType: string | null;
  locationLat: number;
  locationLng: number;
}

const KSA_CENTER = { lat: 21.4858, lng: 39.1925, zoom: 5.2 };

const STATUS_COLOR: Record<string, string> = {
  loaded: "rgb(var(--color-accent))",
  in_transit: "rgb(var(--color-warning))",
  inspection: "rgb(var(--color-success))",
  empty: "rgb(var(--color-text-dim))",
};

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    { id: "osm", type: "raster", source: "osm" },
  ],
};

export function LiveMap({ containers }: { containers: PositionedContainer[] }) {
  const t = useTranslations();
  const [active, setActive] = useState<PositionedContainer | null>(null);

  const initialView = useMemo(() => {
    if (containers.length === 0) return KSA_CENTER;
    const lat = containers.reduce((s, c) => s + c.locationLat, 0) / containers.length;
    const lng = containers.reduce((s, c) => s + c.locationLng, 0) / containers.length;
    return { lat, lng, zoom: containers.length === 1 ? 14 : 11 };
  }, [containers]);

  if (containers.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-xl border border-dashed border-border bg-card-inner text-sm text-text-muted">
        {t("liveMap.noPositions")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height: "70vh" }}>
      <Map
        initialViewState={{
          longitude: initialView.lng,
          latitude: initialView.lat,
          zoom: initialView.zoom,
        }}
        mapStyle={OSM_STYLE}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />

        {containers.map((c) => (
          <Marker
            key={c.id}
            longitude={c.locationLng}
            latitude={c.locationLat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setActive(c);
            }}
          >
            <button
              type="button"
              className="group relative flex h-3.5 w-3.5 items-center justify-center"
              aria-label={c.isoCode}
            >
              <span
                className="absolute inset-0 rounded-full opacity-30"
                style={{ background: STATUS_COLOR[c.status] ?? "rgb(var(--color-accent))" }}
              />
              <span
                className="relative h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
                style={{ background: STATUS_COLOR[c.status] ?? "rgb(var(--color-accent))" }}
              />
            </button>
          </Marker>
        ))}

        {active && (
          <Popup
            longitude={active.locationLng}
            latitude={active.locationLat}
            anchor="bottom"
            onClose={() => setActive(null)}
            closeOnClick={false}
            offset={14}
          >
            <div className="space-y-1 p-1 text-xs">
              <p className="font-mono text-[13px]">{active.isoCode}</p>
              <p className="text-text-muted">{active.status}</p>
              {active.cargoType && (
                <p className="text-text-dim">{active.cargoType}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
