import type { StyleSpecification } from "maplibre-gl";
import type { MapViewportState, BasemapStyleId } from "./types";

/**
 * Sensible default geographic viewport centered on Vellore / Tamil Nadu, India.
 * Does not query or require user geolocation permissions.
 */
export const DEFAULT_MAP_VIEWPORT: MapViewportState = {
  longitude: 79.1325,
  latitude: 12.9165,
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

/**
 * Self-contained MapLibre Style Specifications for standard basemaps.
 * These require NO external API keys and load directly via standard public tile providers.
 */
export const BASEMAP_STYLES: Record<BasemapStyleId, StyleSpecification> = {
  dark: {
    version: 8,
    sources: {
      "carto-dark-tiles": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "carto-dark-layer",
        type: "raster",
        source: "carto-dark-tiles",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
  light: {
    version: 8,
    sources: {
      "carto-light-tiles": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "carto-light-layer",
        type: "raster",
        source: "carto-light-tiles",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
  streets: {
    version: 8,
    sources: {
      "carto-streets-tiles": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "carto-streets-layer",
        type: "raster",
        source: "carto-streets-tiles",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
  satellite: {
    version: 8,
    sources: {
      "esri-satellite-tiles": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.esri.com/">Esri</a>, USGS, Maxar, Earthstar Geographics',
      },
    },
    layers: [
      {
        id: "esri-satellite-layer",
        type: "raster",
        source: "esri-satellite-tiles",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
};
