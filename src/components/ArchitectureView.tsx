import React, { useState } from 'react';
import { Shield, Sparkles, BookOpen, Send, Layers, HelpCircle, HardDrive, Cpu, Database, Check } from 'lucide-react';

export default function ArchitectureView() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const predefinedQuestions = [
    { q: "Why AES-256-GCM?", a: "AES-256-GCM is an AEAD (Authenticated Encryption with Associated Data) mode. Unlike traditional CBC mode which only ensures confidentiality, GCM provides integrity verification. Any single-bit change on disk results in an immediate authentication Tag failure before decryption finishes, preventing oracle block forgery. It is faster due to parallel hardware PIPELINE pipelining on modern CPUs (Intel AES-NI)." },
    { q: "Why custom B-Trees?", a: "Traditional in-memory pointers like Red-Black trees trigger high L1/L2 cache miss frequencies because nodes reside randomly in memory. Custom B-Trees arrange sequentially grouped child records into sequential contiguous keys block. This design maps to standard filesystem sector sizes perfectly, maximizing locality of reference, resulting in O(log n) indexing traversals that require fewer disk sector pulls." },
    { q: "Why lock-free reads?", a: "Reader-writer lock mutex structures force cores to undergo system context-switches and block whenever a single write locks the index. Lock-free cache reads leverage atomic pointer operations (std::atomic lookups and CAS) allowing unlimited concurrent readers to traverse nodes in memory with zero latch barriers, elevating read through-scale by 3x+." },
    { q: "Why chunked storage?", a: "Storing 1M+ massive documents directly in individual database buffers creates memory threshold starvation. Chunked storage partitions oversized payloads into discrete independent blocks (e.g. 1MB segments). Splatting blocks into distinct sectors facilitates parallel encrypt routines, fast resumption on network dropouts, and enables global block-level duplicate removal." },
    { q: "Deduplication & deduplication bottlenecks?", a: "SECUREVAULT computes a content SHA-256 hash pre-encryption on individual blocks. Metadata maps files blocks to standard chunks junction references. If a duplicate exists, we simply increment the reference counter on the block, reducing redundant block writes. Scaling to 100M files / petabytes creates SHA-256 check index bottlenecks in database layers, mitigated by partitioned index caches." }
  ];

  const handleAskArchitect = async (customPrompt?: string) => {
    const userPrompt = customPrompt || query;
    if (!userPrompt.trim()) return;

    setIsLoading(true);
    setResponse('');
    
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });
      const data = await res.json();
      setResponse(data.text || "No response received from model.");
    } catch (err: any) {
      setResponse(`**Architect Response (Offline Connection Fallback)**\n\nFailed to contact live engine: ${err.message || "Network Error"}. Please verify your network contexts. Or double-check your **Settings > Secrets** panel.`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPredefined = (item: typeof predefinedQuestions[0]) => {
    setActiveQuestion(item.q);
    setResponse(item.a);
    setQuery(item.q);
  };

  return (
    <div id="architecture-view-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* Blueprint Visual SVG Panel (Left Column) */}
      <div id="blueprint-panel" className="lg:col-span-6 flex flex-col gap-6">
        <div id="blueprint-card" className="bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="text-[#10b981] w-5 h-5" />
            <h3 className="font-semibold text-slate-100 tracking-tight">System Engineering Blueprint</h3>
          </div>

          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            SECUREVAULT separates API orchestration from kernel storage pipelines to eliminate memory exposure. Spring Boot validates JWT bounds and manages Postgres logs, whilst the C++20 engine processes GCM blocks with lock-free atomic queues.
          </p>

          {/* Styled Interactive SVG Design diagram */}
          <div className="bg-[#0F1419] border border-slate-800 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
            <svg viewBox="0 0 420 320" className="w-full h-auto text-xs font-mono">
              {/* Clients */}
              <rect x="150" y="10" width="120" height="35" rx="5" fill="#1C232B" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="210" y="31" fill="#f8fafc" textAnchor="middle" fontSize="10">USER CLIENTS / SDK</text>

              {/* Arrow down */}
              <line x1="210" y1="45" x2="210" y2="70" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Spring Boot API */}
              <rect x="130" y="70" width="160" height="40" rx="5" fill="#1C232B" stroke="#10b981" strokeWidth="1.5" />
              <text x="210" y="90" fill="#f8fafc" textAnchor="middle" fontSize="9" fontWeight="bold">SPRING BOOT API BOUNDARY</text>
              <text x="210" y="102" fill="#10b981" textAnchor="middle" fontSize="8">(JWT / Rate Limiter / RBAC Filter)</text>

              {/* Arrow Split down to Postgres and Engine */}
              <path d="M 130 90 L 70 90 L 70 140" fill="none" stroke="#475569" strokeWidth="1.5" />
              <path d="M 290 90 L 350 90 L 350 140" fill="none" stroke="#475569" strokeWidth="1.5" />

              {/* PostgreSQL Schema Table */}
              <rect x="10" y="140" width="120" height="40" rx="4" fill="#0B0F13" stroke="#3b82f6" strokeWidth="1" />
              <text x="70" y="160" fill="#94a3b8" textAnchor="middle" fontSize="8">POSTGRES DB</text>
              <text x="70" y="171" fill="#475569" textAnchor="middle" fontSize="7">(Immutable Audit Logs)</text>

              {/* C++ SecureVault Engine Kernel */}
              <rect x="290" y="140" width="120" height="40" rx="4" fill="#141920" stroke="#f59e0b" strokeWidth="1" />
              <text x="350" y="160" fill="#f8fafc" textAnchor="middle" fontSize="8">C++20 ENGINE DAEMON</text>
              <text x="350" y="171" fill="#f59e0b" textAnchor="middle" fontSize="7">(Raw Crypto Services)</text>

              {/* Arrown down from Engine to crypto and cache */}
              <line x1="350" y1="180" x2="350" y2="210" stroke="#475569" strokeWidth="1" />
              <line x1="70" y1="180" x2="70" y2="240" stroke="#475569" strokeWidth="1" />

              {/* Lock-Free reading Cache Index */}
              <rect x="240" y="210" width="100" height="30" rx="3" fill="#1C232B" stroke="#3b82f6" strokeWidth="1" />
              <text x="290" y="228" fill="#94a3b8" textAnchor="middle" fontSize="8">B-Tree index CAS</text>

              {/* AES OpenSSL encryption Layer */}
              <rect x="310" y="255" width="100" height="30" rx="3" fill="#1C232B" stroke="#10b981" strokeWidth="1" />
              <text x="360" y="273" fill="#10b981" textAnchor="middle" fontSize="8">OpenSSL AES-GCM</text>

              {/* Final Encrypted Filesystem Blocks */}
              <rect x="140" y="270" width="140" height="35" rx="4" fill="#0F1419" stroke="#ef4444" strokeWidth="1.5" />
              <text x="210" y="291" fill="#ef4444" textAnchor="middle" fontSize="9" fontWeight="bold">ENCRYPTED FS BLOCKS</text>

              {/* Connectors */}
              <line x1="290" y1="240" x2="210" y2="270" stroke="#475569" strokeWidth="1" />
              <line x1="360" y1="255" x2="210" y2="270" stroke="#475569" strokeWidth="1" />

              {/* Definitions */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        {/* Security controls list and hardening explanations */}
        <div id="hardening-list-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="text-xs uppercase text-slate-400 font-mono tracking-wider border-b border-slate-800 pb-2">SECUREVAULT Kernel Hardening Matrix</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {[
              { title: "Constant-Time Compare", desc: "Accumulates bitwise XOR mismatches instead of returning immediately, eliminating side-channel data leaks." },
              { title: "Volatile Memory Wipe", desc: "Utilizes volatile buffers with active zero-fills. Compiler optimization never wipes functional keys." },
              { title: "PBKDF2 HMAC SHA-256", desc: "Derives secure keys safely over 100,000 iterations to resist GPU-accelerated hashing dictionary attacks." },
              { title: "AEAD MAC Tag verification", desc: "Decryption instantly cross-examines 128-bit MAC values pre-read, aborting on single-bit modifications." }
            ].map((control, cIdx) => (
              <div key={cIdx} className="bg-[#0F1419] border border-slate-800 rounded p-3 flex flex-col gap-1">
                <span className="text-[#10b981] font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {control.title}
                </span>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  {control.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Systems Design Coach & Interview Board (Right Column) */}
      <div id="coach-panel" className="lg:col-span-6 flex flex-col gap-6">
        <div id="coach-card" className="bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-yellow-500 w-5 h-5 animate-pulse-soft" />
              <h3 className="font-semibold text-slate-100 tracking-tight">Interactive Systems Design Coach</h3>
            </div>
            
            <span className="text-[10px] font-mono bg-yellow-950/40 text-yellow-500 border border-yellow-905/40 px-2.5 py-0.5 rounded">
              GEMINI PRO CHIP ENABLED
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Have questions regarding SECUREVAULT, C++ storage, lock-free threads, or how this design scales to support 100M files / Petabyte-scale architectures? Ask our interactive coach!
          </p>

          {/* Quick Select Questions catalogue */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Select standard design topics:</span>
            <div className="flex flex-wrap gap-2">
              {predefinedQuestions.map((item, idx) => (
                <button
                  key={idx}
                  id={`predefined-q-btn-${idx}`}
                  onClick={() => selectPredefined(item)}
                  className={`text-[10px] font-mono px-2.5 py-1.5 rounded transition-all cursor-pointer border ${
                    activeQuestion === item.q 
                      ? 'bg-yellow-950/30 border-yellow-500/50 text-yellow-500' 
                      : 'bg-[#0F1419] border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.q}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Custom query field */}
          <div className="flex gap-2 border-t border-slate-800-40 pt-4">
            <input 
              id="coach-custom-input"
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. How does garbage collection run in lock-free lists?"
              className="flex-1 bg-[#0F1419] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 font-sans focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAskArchitect()}
            />
            
            <button 
              id="ask-coach-btn"
              onClick={() => handleAskArchitect()}
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-md"
            >
              <Send className="w-3.5 h-3.5" /> ASK COACH
            </button>
          </div>

          {/* Answer display console */}
          <div className="bg-[#0F1419] border border-slate-800 rounded-lg p-4 min-h-[160px] max-h-[310px] overflow-y-auto leading-relaxed text-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 h-full py-12">
                <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 font-mono text-[10px] animate-pulse">Consulting Principal Systems Engineers...</span>
              </div>
            ) : response ? (
              <div className="text-slate-300 font-sans leading-relaxed whitespace-pre-line space-y-3 prose prose-invert select-all">
                {response}
              </div>
            ) : (
              <div className="text-slate-500 font-sans flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
                <p className="max-w-xs">Click a predefined systems topic above or type a custom question to generate production grading interview advice.</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
