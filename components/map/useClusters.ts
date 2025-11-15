'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

// Local type definitions (since worker types cannot be directly imported)
type Feature = GeoJSON.Feature<GeoJSON.Point>;

type WorkerMessage =
  | { type: 'build'; points: Feature[]; options?: any }
  | { type: 'query'; bbox: [number, number, number, number]; zoom: number }
  | { type: 'expand'; clusterId: number; clusterZoom: number }
  | { type: 'clear' };

type WorkerResponse =
  | { type: 'built'; pointCount: number }
  | { type: 'clusters'; clusters: any[] }
  | { type: 'expanded'; leaves: any[] }
  | { type: 'error'; message: string };

interface UseClusterOptions {
  radius?: number;
  maxZoom?: number;
  minPoints?: number;
}

interface UseClusterResult {
  ready: boolean;
  clusters: any[];
  query: (bbox: [number, number, number, number], zoom: number) => void;
  expand: (clusterId: number, clusterZoom: number) => Promise<any[]>;
  error: string | null;
  loading: boolean;
}

/**
 * React hook for Web Worker-based map clustering
 * Offloads Supercluster computation to prevent main thread blocking
 *
 * @param points - GeoJSON points to cluster
 * @param options - Clustering options
 * @returns Cluster state and methods
 */
export function useClusters(points: Feature[], options: UseClusterOptions = {}): UseClusterResult {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize worker and build index
  useEffect(() => {
    if (!points || points.length === 0) {
      setReady(false);
      setClusters([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Create worker
    try {
      const worker = new Worker(new URL('./cluster.worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current = worker;

      // Handle worker messages
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const response = e.data;

        switch (response.type) {
          case 'built':
            console.log(`Cluster index built with ${response.pointCount} points`);
            setReady(true);
            setLoading(false);
            break;

          case 'clusters':
            setClusters(response.clusters);
            break;

          case 'expanded':
            // Handle expanded leaves if needed
            break;

          case 'error':
            console.error('Worker error:', response.message);
            setError(response.message);
            setLoading(false);
            break;
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        setError('Worker failed to load');
        setLoading(false);
      };

      // Build cluster index
      const buildMessage: WorkerMessage = {
        type: 'build',
        points,
        options: {
          radius: options.radius || 60,
          maxZoom: options.maxZoom || 20,
          minPoints: options.minPoints || 2,
        },
      };

      worker.postMessage(buildMessage);
    } catch (err: any) {
      console.error('Failed to create worker:', err);
      setError(err?.message || 'Failed to initialize clustering');
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'clear' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [points, options.radius, options.maxZoom, options.minPoints]);

  // Query clusters for viewport
  const query = useCallback(
    (bbox: [number, number, number, number], zoom: number) => {
      if (!workerRef.current || !ready) {
        console.warn('Worker not ready for queries');
        return;
      }

      const queryMessage: WorkerMessage = {
        type: 'query',
        bbox,
        zoom,
      };

      workerRef.current.postMessage(queryMessage);
    },
    [ready]
  );

  // Expand a cluster to get its leaves
  const expand = useCallback(
    (clusterId: number, clusterZoom: number): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !ready) {
          reject(new Error('Worker not ready'));
          return;
        }

        const handleResponse = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.type === 'expanded') {
            workerRef.current?.removeEventListener('message', handleResponse);
            resolve(e.data.leaves);
          } else if (e.data.type === 'error') {
            workerRef.current?.removeEventListener('message', handleResponse);
            reject(new Error(e.data.message));
          }
        };

        workerRef.current.addEventListener('message', handleResponse);

        const expandMessage: WorkerMessage = {
          type: 'expand',
          clusterId,
          clusterZoom,
        };

        workerRef.current.postMessage(expandMessage);
      });
    },
    [ready]
  );

  return useMemo(
    () => ({
      ready,
      clusters,
      query,
      expand,
      error,
      loading,
    }),
    [ready, clusters, query, expand, error, loading]
  );
}
