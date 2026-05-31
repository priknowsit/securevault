export interface MetadataEntry {
  fileId: string;
  owner: string;
  hash: string;
  size: number;
  timestamp: string;
  storageLocation: string;
}

export interface BTreeNode {
  id: string;
  keys: string[];
  values: MetadataEntry[];
  children: BTreeNode[];
  isLeaf: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'FAILED';
  role: string;
  ip: string;
}

export interface ChunkItem {
  id: string;
  index: number;
  originalText: string;
  encryptedBase64: string;
  ivHex: string;
  tagHex: string;
  hash: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
  size: number;
}

export interface BenchmarkStat {
  threads: number;
  mutexThroughput: number; // MB/s
  lockFreeThroughput: number; // MB/s
  mutexLatency: number; // ms
  lockFreeLatency: number; // ms
  memoryUsedKb: number;
}
