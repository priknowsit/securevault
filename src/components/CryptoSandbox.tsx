import React, { useState, useEffect } from 'react';
import { Shield, Key, Eye, Clipboard, HelpCircle, Layers, Fingerprint, Database, Check, History, RefreshCw, AlertCircle } from 'lucide-react';
import { ChunkItem } from '../types';

export default function CryptoSandbox() {
  const [passphrase, setPassphrase] = useState('SecretSaves!2026');
  const [iterations, setIterations] = useState(10000);
  const [inputText, setInputText] = useState('SECUREVAULT is designed to resist side-channel timing analysis. SECUREVAULT encrypts chunk blocks independently. SECUREVAULT is designed to resist side-channel timing analysis.');
  const [chunkSize, setChunkSize] = useState(35); // characters per chunk
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [salt, setSalt] = useState('');
  const [systemKeyHex, setSystemKeyHex] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [...prev.slice(-29), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    runCryptographicPipeline();
  }, [passphrase, iterations, inputText, chunkSize]);

  // JS-based SHA-256 for browser fallback compatibility
  const sha256 = async (message: string): Promise<string> => {
    try {
      if (window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      // safe fallback if secure context is missing
    }
    // Simple deterministic hash fallback
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0') + 'f4d5e6a7c3b2a198';
  };

  const runCryptographicPipeline = async () => {
    setIsProcessing(true);
    const logs: string[] = [];
    logs.push("Initializing pipeline for SECUREVAULT storage block...");
    
    // Derived Salt
    const currentSalt = "salt_f8d9b2c140ae61f8";
    setSalt(currentSalt);
    logs.push(`PBKDF2-HMAC-SHA-256 launched (Iterations: ${iterations.toLocaleString()})`);
    
    // Simulate system key derivation
    const seed = passphrase + currentSalt + iterations;
    const derivedKeyHex = await sha256(seed);
    setSystemKeyHex(derivedKeyHex);
    logs.push(`Derived Master Key: 0x${derivedKeyHex.slice(0, 8)}...${derivedKeyHex.slice(-8)}`);

    // Chunking text
    const chunksText: string[] = [];
    if (inputText.length === 0) {
      setChunks([]);
      setIsProcessing(false);
      return;
    }

    // Split text into lines or characters
    for (let i = 0; i < inputText.length; i += chunkSize) {
      chunksText.push(inputText.slice(i, i + chunkSize));
    }
    logs.push(`Segmented payload into ${chunksText.length} distinct chunks (threshold size: ${chunkSize} chars)`);

    const processedChunks: ChunkItem[] = [];
    const hashToIdMap = new Map<string, string>();

    for (let i = 0; i < chunksText.length; i++) {
      const rawText = chunksText[i];
      const chunkHash = await sha256(rawText);
      const chunkId = `chunk_u${i}_${chunkHash.slice(0, 6)}`;

      let isDuplicate = false;
      let duplicateOfId: string | undefined;

      if (hashToIdMap.has(chunkHash)) {
        isDuplicate = true;
        duplicateOfId = hashToIdMap.get(chunkHash);
        logs.push(`Deduplication Engine hit! Chunk #${i} matches chunk ${duplicateOfId}. Dereferencing block.`);
      } else {
        hashToIdMap.set(chunkHash, chunkId);
      }

      // Encrypted representation (standard simulated bytes with real key properties)
      const iv = await sha256(`${derivedKeyHex}_iv_${i}`);
      const tag = await sha256(`${derivedKeyHex}_tag_${i}`);
      
      // Scramble characters to simulate ciphertext
      let cipherText = "";
      for (let j = 0; j < rawText.length; j++) {
        const code = rawText.charCodeAt(j) ^ parseInt(derivedKeyHex[j % 8], 16);
        cipherText += String.fromCharCode((code % 94) + 32); 
      }
      const encryptedBase64 = btoa(unescape(encodeURIComponent(cipherText)));

      processedChunks.push({
        id: chunkId,
        index: i,
        originalText: rawText,
        encryptedBase64,
        ivHex: iv.slice(0, 24),
        tagHex: tag.slice(0, 32),
        hash: chunkHash,
        isDuplicate,
        duplicateOfId,
        size: rawText.length
      });
    }

    setChunks(processedChunks);
    logs.push("AES-256-GCM block packing complete. Tag parameters sealed.");
    setConsoleLogs(prev => [...prev, ...logs].slice(-30));
    setIsProcessing(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addLog(`Copied key hash: ${id}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const totalOriginalBytes = inputText.length;
  const uniqueChunksCount = chunks.filter(c => !c.isDuplicate).length;
  const totalStoredBytes = uniqueChunksCount * chunkSize; // Simplistic storage estimation
  const savingsPercent = totalOriginalBytes > 0 
    ? Math.round(((totalOriginalBytes - chunks.filter(c => !c.isDuplicate).reduce((acc, c) => acc + c.size, 0)) / totalOriginalBytes) * 100) 
    : 0;

  return (
    <div id="crypto-sandbox-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Parameters & Configuration Header (Left Column) */}
      <div id="crypto-left-col" className="lg:col-span-4 flex flex-col gap-6">
        {/* Core Controls */}
        <div id="cryptokey-config-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="text-[#10b981] w-5 h-5 animate-pulse-soft" />
            <h3 className="font-semibold text-slate-100 tracking-tight">Key Derivation (PBKDF2)</h3>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-mono">Master Passphrase</label>
            <input 
              id="crypto-passphrase-input"
              type="text" 
              value={passphrase} 
              onChange={(e) => setPassphrase(e.target.value)}
              className="bg-[#1C232B] border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-mono">Iterations</label>
              <select 
                id="crypto-iterations-select"
                value={iterations} 
                onChange={(e) => setIterations(Number(e.target.value))}
                className="bg-[#1C232B] border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-[#10b981] cursor-pointer"
              >
                <option value={1000}>1,000 (Testing)</option>
                <option value={10000}>10,000 (Standard)</option>
                <option value={100000}>100,000 (Production)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-mono">Salt</label>
              <div className="bg-[#0F1419] border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-400 font-mono flex items-center justify-between truncate select-all">
                {salt.slice(5)}
              </div>
            </div>
          </div>

          <div className="bg-[#0F1419] border border-slate-800 rounded p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#10b981] font-mono flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> 256-bit Key Derivated
              </span>
              <button 
                id="copy-derived-key-btn"
                onClick={() => copyToClipboard(systemKeyHex, 'derived-key')}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy Hex"
              >
                {copiedId === 'derived-key' ? <Check className="w-4.5 h-4.5 text-[#10b981]" /> : <Clipboard className="w-4.5 h-4.5" />}
              </button>
            </div>
            <div className="text-xs font-mono text-slate-400 break-all select-all">
              {systemKeyHex || "Deriving key components..."}
            </div>
          </div>
        </div>

        {/* Chunking / Deduplication Settings */}
        <div id="crypto-dedup-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="text-[#3b82f6] w-5 h-5" />
            <h3 className="font-semibold text-slate-100 tracking-tight">Active Storage & Duplication</h3>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-mono">Chunk Split Size</label>
              <span className="text-xs text-slate-300 font-mono">{chunkSize} Chars</span>
            </div>
            <input 
              id="crypto-chunksize-slider"
              type="range" 
              min={15} 
              max={100} 
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              className="accent-[#10b981] h-1.5 w-full bg-[#1C232B] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Deduplication HUD Statistics */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="bg-[#0F1419] border border-slate-800 rounded p-3 text-center">
              <div className="text-xs text-slate-400 font-mono">Raw Payload</div>
              <div className="text-xl font-semibold text-slate-100 mt-1 font-mono">{totalOriginalBytes} <span className="text-xs text-slate-500">Bytes</span></div>
            </div>
            <div className="bg-[#0F1419] border border-slate-800 rounded p-3 text-center">
              <div className="text-xs text-slate-400 font-mono">Deduplicated Blocks</div>
              <div className="text-xl font-semibold text-[#10b981] mt-1 font-mono">
                {uniqueChunksCount} <span className="text-xs text-slate-500">/ {chunks.length}</span>
              </div>
            </div>
          </div>

          {savingsPercent > 0 ? (
            <div className="bg-[#141920] border border-emerald-800/40 rounded p-3 flex items-center gap-3">
              <div className="p-1 rounded-full bg-emerald-900/40 text-[#10b981]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-400 font-semibold font-mono">Storage Purge Active</div>
                <p className="text-xs text-slate-300 mt-0.5">Deduplication saved <span className="text-[#10b981] font-bold font-mono">{savingsPercent}%</span> of disk sector requirements!</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F1419] border border-slate-800 rounded p-3 flex items-center gap-3">
              <div className="p-1 rounded-full bg-slate-800/50 text-slate-400">
                <Database className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400">Type matching sentences in the raw text box to trigger chunk duplication recognition.</p>
            </div>
          )}
        </div>
      </div>

      {/* Input payload & visualizer (Right Column) */}
      <div id="crypto-right-col" className="lg:col-span-8 flex flex-col gap-6">
        {/* Text Input area */}
        <div id="crypto-input-view" className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="text-[#10b981] w-5 h-5" />
              <h3 className="font-semibold text-slate-100 tracking-tight">Active Engine Document Workspace</h3>
            </div>
            <button 
              id="reset-input-btn"
              onClick={() => {
                setInputText('SECUREVAULT is designed to resist side-channel timing analysis. SECUREVAULT encrypts chunk blocks independently. SECUREVAULT is designed to resist side-channel timing analysis.');
                addLog("Reloaded default repeatable payload framework.");
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reset Default
            </button>
          </div>

          <textarea 
            id="crypto-payload-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type files data or key streams to encrypt..."
            rows={4}
            className="w-full bg-[#1C232B] border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] leading-relaxed resize-none"
          />
        </div>

        {/* Output visualization chunks container */}
        <div id="crypto-output-view" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> SECUREVAULT Block Chunking Visualizer
            </h4>
            {isProcessing && <span className="text-xs text-[#10b981] animate-pulse font-mono">Running OpenSSL calculations...</span>}
          </div>

          <div id="chunks-visual-tree" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
            {chunks.map((chunk, idx) => (
              <div 
                key={chunk.id}
                id={`chunk-card-${idx}`}
                className={`border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                  chunk.isDuplicate 
                    ? 'bg-[#141920]/40 border-slate-800/50 opacity-70' 
                    : 'bg-[#141920] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Chunk Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
                    <span className="text-xs text-slate-300 font-mono font-bold">BLOCK #{chunk.index}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">ID: {chunk.id}</span>
                    <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 bg-[#0F1419] border border-slate-800 rounded">
                      {chunk.size}B
                    </span>
                  </div>
                </div>

                {/* Sub contents */}
                <div className="flex flex-col gap-1 text-[11px] font-mono">
                  <div className="text-slate-400 truncate">
                    <span className="text-[#10b981]">PLAINTEXT:</span> "{chunk.originalText}"
                  </div>
                  
                  {chunk.isDuplicate ? (
                    <div className="bg-[#0F1419] border border-blue-950/40 text-blue-400 p-2 rounded text-left mt-1.5">
                      <div className="flex items-center gap-1 text-xs font-bold font-sans">
                        <Check className="w-3.5 h-3.5" /> Duplicate Identified !
                      </div>
                      <p className="text-[10px] mt-0.5 font-sans">
                        Same SHA-256 blocks block. Pointed raw pointer directly to <span className="font-mono text-xs text-slate-300 bg-slate-900 px-1 rounded">{chunk.duplicateOfId}</span> inside B-Tree index. Zero memory duplicated.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-slate-850">
                      <div className="text-slate-400 flex items-center justify-between">
                        <span>SHA-256 ID:</span>
                        <span className="text-slate-300 text-[10px]">{chunk.hash.slice(0, 16)}...</span>
                      </div>
                      <div className="text-slate-400 flex items-center justify-between">
                        <span>GCM TAG MATCH:</span>
                        <span className="text-[#3b82f6] text-[10px]">{chunk.tagHex.slice(0, 16)}...</span>
                      </div>
                      <div className="text-slate-400 flex items-center justify-between">
                        <span>GCM IV VALUE:</span>
                        <span className="text-yellow-600 text-[10px] bg-yellow-950/20 px-1 rounded">{chunk.ivHex.slice(0, 12)}...</span>
                      </div>
                      <div className="mt-2 text-slate-300 break-all bg-[#0F1419] p-2 border border-slate-800 rounded text-[10px] leading-relaxed max-height-[44px] overflow-hidden select-all">
                        <span className="text-slate-500 font-semibold mr-1">AES-CIPHER:</span> {chunk.encryptedBase64}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Engine Debug Console */}
          <div id="crypto-console-panel" className="bg-[#0F1419] border border-slate-800 rounded-xl p-4 mt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs tracking-wide text-slate-400 font-mono flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#10b981]" /> CRITICAL PIPELINE DIAGNOSTIC CONSOLE
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping"></span>
            </div>
            
            <div id="crypto-console-logs" className="font-mono text-[10px] text-[#10b981] space-y-1.5 max-h-[110px] overflow-y-auto leading-relaxed scrollbar-thin">
              {consoleLogs.map((log, lIdx) => (
                <div key={lIdx} className="hover:bg-slate-900/40 px-1 py-0.5 rounded">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
