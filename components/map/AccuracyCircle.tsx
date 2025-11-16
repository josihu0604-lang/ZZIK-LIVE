'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface AccuracyCircleProps {
  map: mapboxgl.Map | null;
  position: { lat: number; lng: number };
  accuracy: number; // meters
  confidence: number; // 0-100
  visible?: boolean;
}

/**
 * Accuracy Circle overlay for Mapbox map
 * Shows GPS accuracy radius with confidence-based styling
 */
export default function AccuracyCircle({
  map,
  position,
  accuracy,
  confidence,
  visible = true,
}: AccuracyCircleProps) {
  const sourceIdRef = useRef('accuracy-circle');
  const layerFillIdRef = useRef('accuracy-circle-fill');
  const layerLineIdRef = useRef('accuracy-circle-line');

  useEffect(() => {
    if (!map || !visible) return;

    const sourceId = sourceIdRef.current;
    const layerFillId = layerFillIdRef.current;
    const layerLineId = layerLineIdRef.current;

    // Generate circle polygon
    const circleGeoJSON = createCircleGeoJSON(
      position.lng,
      position.lat,
      accuracy
    );

    // Determine colors based on confidence
    const { fillColor, lineColor, fillOpacity } = getConfidenceStyles(confidence);

    // Add or update source
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(circleGeoJSON);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: circleGeoJSON,
      });
    }

    // Add or update fill layer
    if (!map.getLayer(layerFillId)) {
      map.addLayer({
        id: layerFillId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': fillColor,
          'fill-opacity': fillOpacity,
        },
      });
    } else {
      map.setPaintProperty(layerFillId, 'fill-color', fillColor);
      map.setPaintProperty(layerFillId, 'fill-opacity', fillOpacity);
    }

    // Add or update line layer
    if (!map.getLayer(layerLineId)) {
      map.addLayer({
        id: layerLineId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': lineColor,
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });
    } else {
      map.setPaintProperty(layerLineId, 'line-color', lineColor);
    }

    // Add pulsing animation for low confidence
    if (confidence < 40) {
      let opacity = fillOpacity;
      let increasing = true;
      const animationFrame = setInterval(() => {
        if (increasing) {
          opacity += 0.02;
          if (opacity >= 0.3) increasing = false;
        } else {
          opacity -= 0.02;
          if (opacity <= fillOpacity) increasing = true;
        }
        
        if (map.getLayer(layerFillId)) {
          map.setPaintProperty(layerFillId, 'fill-opacity', opacity);
        }
      }, 50);

      return () => clearInterval(animationFrame);
    }

  }, [map, position, accuracy, confidence, visible]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      
      const sourceId = sourceIdRef.current;
      const layerFillId = layerFillIdRef.current;
      const layerLineId = layerLineIdRef.current;

      if (map.getLayer(layerFillId)) {
        map.removeLayer(layerFillId);
      }
      if (map.getLayer(layerLineId)) {
        map.removeLayer(layerLineId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map]);

  return null; // This component doesn't render any DOM elements
}

/**
 * Get styling based on confidence level
 */
function getConfidenceStyles(confidence: number): {
  fillColor: string;
  lineColor: string;
  fillOpacity: number;
} {
  if (confidence >= 70) {
    // High confidence - green
    return {
      fillColor: '#22c55e',
      lineColor: '#16a34a',
      fillOpacity: 0.15,
    };
  } else if (confidence >= 40) {
    // Medium confidence - yellow
    return {
      fillColor: '#eab308',
      lineColor: '#ca8a04',
      fillOpacity: 0.2,
    };
  } else {
    // Low confidence - red (with pulsing)
    return {
      fillColor: '#ef4444',
      lineColor: '#dc2626',
      fillOpacity: 0.15,
    };
  }
}

/**
 * Create a circle polygon GeoJSON
 */
function createCircleGeoJSON(
  lng: number,
  lat: number,
  radiusMeters: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const R = 6378137; // Earth radius in meters

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * 2 * Math.PI;
    const dx = (radiusMeters * Math.cos(theta)) / R;
    const dy = (radiusMeters * Math.sin(theta)) / R;
    const lngOffset = (dx / Math.cos((lat * Math.PI) / 180)) * (180 / Math.PI);
    const latOffset = dy * (180 / Math.PI);
    coords.push([lng + lngOffset, lat + latOffset]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {},
  };
}