import { z } from 'zod';

export const ScanVerifyReq = z.object({
  raw: z.string().min(1),
  ts: z.number().int(),
  source: z.enum(['BarcodeDetector', 'jsQR', 'ZXing']),
  location: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      accuracy: z.number().optional(),
    })
    .optional(),
  evidence: z
    .object({
      receiptId: z.string().optional(),
    })
    .optional(),
});

export type ScanVerifyReq = z.infer<typeof ScanVerifyReq>;
