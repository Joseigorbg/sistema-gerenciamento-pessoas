
// Declaração para o objeto L global do Leaflet (carregado via CDN)
declare global {
  namespace L {
    function map(id: string | HTMLElement, options?: MapOptions): Map;
    function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
    function marker(latlng: LatLngExpression, options?: MarkerOptions): Marker;
    function icon(options: IconOptions): Icon;
    function markerClusterGroup(options?: any): MarkerClusterGroup;

    interface MapOptions {
      center?: LatLngExpression;
      zoom?: number;
      layers?: Layer[];
      // Add other options as needed
    }

    interface TileLayerOptions {
      attribution?: string;
      maxZoom?: number;
      // Add other options as needed
    }

    interface MarkerOptions {
      icon?: Icon | DivIcon;
      // Add other options as needed
    }

    interface IconOptions {
      iconUrl: string;
      iconSize?: PointExpression;
      iconAnchor?: PointExpression;
      popupAnchor?: PointExpression;
      shadowUrl?: string;
      shadowSize?: PointExpression;
      shadowAnchor?: PointExpression;
    }

    interface Map extends Evented {
      setView(center: LatLngExpression, zoom?: number, options?: ZoomPanOptions): this;
      addLayer(layer: Layer): this;
      removeLayer(layer: Layer): this;
      remove(): this;
      // Add other methods as needed
    }

    interface Layer extends Evented {}
    interface TileLayer extends Layer {}
    interface Marker extends Layer {
      bindPopup(content: ((layer: Layer) => Content) | Content | Popup, options?: PopupOptions): this;
      // Add other methods as needed
    }
    interface Icon extends Layer {}
    interface DivIcon extends Icon {}
    interface MarkerClusterGroup extends Layer {
      addLayer(layer: Layer): this;
      removeLayer(layer: Layer): this;
      clearLayers(): this;
      // Add other methods as needed
    }

    interface Evented {
      on(type: string, fn: EventHandlerFn, context?: any): this;
      off(type: string, fn?: EventHandlerFn, context?: any): this;
      // Add other methods as needed
    }

    type LatLngExpression = LatLng | LatLngLiteral | LatLngTuple;
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    type LatLngTuple = [number, number];
    interface LatLng {}

    type PointExpression = Point | PointTuple;
    type PointTuple = [number, number];
    interface Point {}

    type Content = string | HTMLElement;
    interface PopupOptions {}
    interface ZoomPanOptions {}
    type EventHandlerFn = (event: LeafletEvent) => void;
    interface LeafletEvent {}
  }
}

// Componente React para o Mapa Leaflet
import React, { useEffect, useRef, useState } from 'react';

interface MapComponentProps {
  locations: { latitude: number; longitude: number; quantidade: number }[];
  center?: [number, number];
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  locations,
  center = [-14.235, -51.9253], // Centro do Brasil
  zoom = 4 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Verifica se o Leaflet foi carregado via CDN
  useEffect(() => {
    const checkLeaflet = () => {
      if (typeof L !== 'undefined' && L.markerClusterGroup) {
        setIsLeafletLoaded(true);
      } else {
        // Tenta novamente após um pequeno atraso
        setTimeout(checkLeaflet, 100);
      }
    };
    checkLeaflet();
  }, []);

  // Inicializa o mapa quando o Leaflet estiver carregado
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current || mapRef.current) return;

    // Inicializa o mapa
    mapRef.current = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
    });

    // Adiciona a camada de tiles (OpenStreetMap)
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(mapRef.current);

    // Inicializa o grupo de clusters
    markerClusterGroupRef.current = L.markerClusterGroup();
    mapRef.current.addLayer(markerClusterGroupRef.current);

    // Limpeza ao desmontar o componente
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [isLeafletLoaded, center, zoom]);

  // Atualiza os marcadores quando as localizações mudam
  useEffect(() => {
    if (!isLeafletLoaded || !markerClusterGroupRef.current) return;

    // Limpa marcadores antigos
    markerClusterGroupRef.current.clearLayers();

    // Adiciona novos marcadores
    locations.forEach(loc => {
      if (loc.latitude !== undefined && loc.longitude !== undefined) {
        const marker = L.marker([loc.latitude, loc.longitude]);
        marker.bindPopup(`<b>Cadastros:</b> ${loc.quantidade}`);
        markerClusterGroupRef.current?.addLayer(marker);
      }
    });
  }, [isLeafletLoaded, locations]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%', minHeight: '400px' }} 
    />
  );
};

export default MapComponent;

