/**
 * Supercluster Web Worker
 * Offloads clustering computation from main thread for better map performance
 * @see https://github.com/mapbox/supercluster
 */

import Supercluster from 'supercluster';
import type { PointFeature } from 'supercluster';

let index: Supercluster<any, any> | null = null;

// Worker message types
export type WorkerMessage =
  | {
      type: 'init';
      points: GeoJSON.Feature<GeoJSON.Point>[];
      options?: Supercluster.Options<any, any>;
    }
  | { type: 'query'; bbox: [number, number, number, number]; zoom: number }
  | { type: 'getLeaves'; clusterId: number; limit?: number; offset?: number }
  | { type: 'getChildren'; clusterId: number }
  | { type: 'clear' };

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;

  try {
    switch (type) {
      case 'init': {
        const { points, options } = e.data;

        // Initialize Supercluster with provided options or defaults
        index = new Supercluster<any, any>({
          radius: 60,
          maxZoom: 17,
          minZoom: 0,
          minPoints: 2,
          ...options,
        });

        // Load points into the index
        index.load(points as PointFeature<any>[]);

        self.postMessage({
          type: 'ready',
          pointCount: points.length,
        });
        break;
      }

      case 'query': {
        if (!index) {
          self.postMessage({
            type: 'error',
            message: 'Index not initialized. Call init first.',
          });
          return;
        }

        const { bbox, zoom } = e.data;
        const clusters = index.getClusters(bbox, Math.floor(zoom));

        self.postMessage({
          type: 'clusters',
          features: clusters,
          count: clusters.length,
        });
        break;
      }

      case 'getLeaves': {
        if (!index) {
          self.postMessage({
            type: 'error',
            message: 'Index not initialized. Call init first.',
          });
          return;
        }

        const { clusterId, limit = 10, offset = 0 } = e.data;
        const leaves = index.getLeaves(clusterId, limit, offset);

        self.postMessage({
          type: 'leaves',
          features: leaves,
        });
        break;
      }

      case 'getChildren': {
        if (!index) {
          self.postMessage({
            type: 'error',
            message: 'Index not initialized. Call init first.',
          });
          return;
        }

        const { clusterId } = e.data;
        const children = index.getChildren(clusterId);

        self.postMessage({
          type: 'children',
          features: children,
        });
        break;
      }

      case 'clear': {
        index = null;
        self.postMessage({ type: 'cleared' });
        break;
      }

      default:
        self.postMessage({
          type: 'error',
          message: `Unknown message type: ${type}`,
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Export types for use in other files
export type Feature = GeoJSON.Feature<GeoJSON.Point>;

export type WorkerResponse =
  | { type: 'ready'; pointCount: number }
  | { type: 'clusters'; features: any[]; count: number }
  | { type: 'leaves'; features: any[] }
  | { type: 'children'; features: any[] }
  | { type: 'cleared' }
  | { type: 'error'; message: string };
