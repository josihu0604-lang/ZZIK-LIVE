// Minimal mapbox-gl type declarations
// For full types, install @types/mapbox-gl when peer dependencies resolved

declare module 'mapbox-gl' {
  export interface MapboxOptions {
    container: string | HTMLElement;
    style?: string;
    center?: [number, number];
    zoom?: number;
    attributionControl?: boolean;
    interactive?: boolean;
  }

  export class Map {
    constructor(options: MapboxOptions);
    addControl(control: any, position?: string): this;
    on(type: string, listener: (ev?: any) => void): this;
    remove(): void;
    static accessToken: string;
  }

  export class NavigationControl {
    constructor(options?: { visualizePitch?: boolean });
  }

  export class GeolocateControl {
    constructor(options?: {
      positionOptions?: PositionOptions;
      trackUserLocation?: boolean;
      showUserHeading?: boolean;
      showAccuracyCircle?: boolean;
    });
    on(type: string, listener: (ev?: any) => void): this;
    trigger(): void;
  }

  const mapboxgl: {
    Map: typeof Map;
    NavigationControl: typeof NavigationControl;
    GeolocateControl: typeof GeolocateControl;
    accessToken: string;
  };

  export default mapboxgl;
}
