import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, BarChart2, ShieldCheck, Layers, Award, Terminal, Zap, HardDrive, Cpu } from 'lucide-react';
import { BenchmarkStat } from '../types';

export default function ThreadSandbox() {
  const [threadCount, setThreadCount] = useState(8);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkStat[]>([]);
  const [queueItems, setQueueItems] = useState<{ id: number; status: 'pending' | 'processing' | 'done'; threadId?: number }[]>([]);
  const [memoryPoolKb, setMemoryPoolKb] = useState(128);
  const [activeTab, setActiveTab] = useState<'throughput' | 'concurrency'>('throughput');

  // Seed default results for beautiful visual charts
  useEffect(() => {
    generateDefaultStats();
    resetQueue();
  }, []);

  const generateDefaultStats = () => {
    const stats: BenchmarkStat[] = [
      { threads: 1, mutexThroughput: 620, lockFreeThroughput: 640, mutexLatency: 2.1, lockFreeLatency: 2.0, memoryUsedKb: 142 },
      { threads: 4, mutexThroughput: 1450, lockFreeThroughput: 2280, mutexLatency: 4.8, lockFreeLatency: 1.2, memoryUsedKb: 254 },
      { threads: 8, mutexThroughput: 1820, lockFreeThroughput: 4120, mutexLatency: 8.4, lockFreeLatency: 1.1, memoryUsedKb: 412 },
      { threads: 16, mutexThroughput: 1100, lockFreeThroughput: 7850, mutexLatency: 18.2, lockFreeLatency: 1.0, memoryUsedKb: 780 },
    ];
    setBenchmarkResult(stats);
  };

  const resetQueue = () => {
    const initialQueue = Array.from({ length: 12 }, (_, idx) => ({
      id: idx + 1,
      status: 'pending' as const,
    }));
    setQueueItems(initialQueue);
  };

  const startBenchmark = () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setCurrentProgress(0);
    resetQueue();

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCurrentProgress(Math.floor((step / 10) * 100));

      // Simulate threads pulling elements from the queue
      setQueueItems(prev => {
        const next = [...prev];
        const pendingIdx = next.findIndex(q => q.status === 'pending');
        if (pendingIdx !== -1) {
          const threadId = Math.floor(Math.random() * threadCount) + 1;
          next[pendingIdx].status = 'processing';
          next[pendingIdx].threadId = threadId;
        }

        // Complete previously processing chunks
        next.forEach((item, index) => {
          if (item.status === 'processing' && Math.random() > 0.4) {
            next[index].status = 'done';
          }
        });

        return next;
      });

      // Gradually expand memory pool allocation to render RAII allocation graphs
      setMemoryPoolKb(prev => prev + Math.floor(Math.random() * 8) + 4);

      if (step >= 10) {
        clearInterval(interval);
        setIsBenchmarking(false);
        setCurrentProgress(100);
        // Ensure everything is marked complete at the end
        setQueueItems(prev => prev.map(item => ({ ...item, status: 'done', threadId: item.threadId || 1 })));
        setMemoryPoolKb(prev => prev + 120);
      }
    }, 400);
  };

  // Safe maximum values for chart scaling
  const maxThroughput = 8000; // 8GB/s top capacity limit
  const maxLatency = 20; // 20ms top latency limit

  return (
    <div id="thread-sandbox-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Concurrency Configuration Sidebar (Left) */}
      <div id="thread-sidebar" className="lg:col-span-4 flex flex-col gap-6">
        {/* Core parameters */}
        <div id="thread-config-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="text-[#10b981] w-5 h-5" />
            <h3 className="font-semibold text-slate-100 tracking-tight">Thread Configuration</h3>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>Concurrent Worker Threads</span>
              <span className="text-[#10b981] font-bold">{threadCount} CORES</span>
            </div>
            <select 
              id="thread-count-select"
              value={threadCount} 
              onChange={(e) => setThreadCount(Number(e.target.value))}
              disabled={isBenchmarking}
              className="bg-[#1C232B] border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-[#10b981] disabled:opacity-50 cursor-pointer"
            >
              <option value={1}>1 Thread (Single Core Bottleneck)</option>
              <option value={4}>4 Threads (Standard Cluster Core)</option>
              <option value={8}>8 Threads (High Performance Node)</option>
              <option value={16}>16 Threads (Enterprise Storage Rig)</option>
            </select>
          </div>

          <div className="bg-[#0F1419] border border-slate-800 rounded p-3 text-xs space-y-1.5 font-mono text-slate-400">
            <div className="text-slate-300 font-semibold mb-1">C++ Storage Safety Bounds:</div>
            <div>• RAII & Mem-lock Allocators (OpenSSL Memory Pool)</div>
            <div>• Atomic `compare_exchange_weak` (CAS operations)</div>
            <div>• Reader-Writer Shared Locality Indexes</div>
          </div>

          <button 
            id="start-benchmark-btn"
            onClick={startBenchmark}
            disabled={isBenchmarking}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-[#0a0f1d] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isBenchmarking ? (
              <>
                <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Running: {currentProgress}%
              </>
            ) : (
              <>
                <Play className="w-4.5 h-4.5" /> Start Engine Benchmark
              </>
            )}
          </button>
        </div>

        {/* Dynamic Interactive Queue Visualizer (Under configurations) */}
        <div id="thread-queue-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 justify-between">
            <span className="text-slate-100 font-semibold text-sm tracking-tight flex items-center gap-1">
              <Layers className="text-[#3b82f6] w-5 h-5" /> Concurrent Upload Queue
            </span>
            <span className="text-[10px] font-mono bg-[#0F1419] px-2 py-0.5 border border-slate-800 text-[#3b82f6] rounded">
              BOUNDED
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {queueItems.map((item) => (
              <div 
                key={item.id}
                id={`queue-item-${item.id}`}
                className={`border rounded-lg p-2 text-center flex flex-col items-center justify-center transition-all duration-300 ${
                  item.status === 'processing' 
                    ? 'border-[#10b981] bg-emerald-950/20 text-[#10b981]' 
                    : item.status === 'done'
                    ? 'border-blue-900/40 bg-blue-950/10 text-blue-400 opacity-60'
                    : 'border-slate-800 bg-[#0F1419] text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono leading-none">BLOCK</div>
                <div className="text-xs font-bold font-mono mt-0.5">{item.id}</div>
                {item.status === 'processing' && (
                  <div className="text-[8px] font-mono text-emerald-400 mt-1 uppercase">T-{item.threadId}</div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 border-t border-slate-800/60 pt-2.5">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Idle</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span> Active CAS</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Sealed</span>
          </div>
        </div>
      </div>

      {/* Main Graph & Benchmark Dashboard (Right Panel) */}
      <div id="thread-charts-view" className="lg:col-span-8 flex flex-col gap-6">
        <div id="thread-tab-card" className="bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-6">
          
          {/* Header Switch */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="text-[#10b981] w-5 h-5" />
              <h3 className="font-semibold text-slate-100 tracking-tight">Active Read Performance Analysis</h3>
            </div>
            
            <div className="flex bg-[#0F1419] p-1 border border-slate-800 rounded-lg">
              <button 
                id="throughput-tab-btn"
                onClick={() => setActiveTab('throughput')}
                className={`px-3 py-1 text-xs font-medium font-mono rounded cursor-pointer transition-all ${activeTab === 'throughput' ? 'bg-[#1C232B] text-[#10b981] border border-slate-800/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Throughput (MB/s)
              </button>
              <button 
                id="concurrency-tab-btn"
                onClick={() => setActiveTab('concurrency')}
                className={`px-3 py-1 text-xs font-medium font-mono rounded cursor-pointer transition-all ${activeTab === 'concurrency' ? 'bg-[#1C232B] text-[#10b981] border border-slate-800/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Latency (ms)
              </button>
            </div>
          </div>

          {/* Interactive Custom SVG Chart */}
          <div id="benchmark-chart-render" className="h-64 flex flex-col justify-end gap-3 rounded-lg border border-slate-800 p-4 bg-[#0F1419] relative overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-500 flex gap-4">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> Lock-Free Reads</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Mutex Reads</span>
            </div>

            {/* Simulated Chart Bars */}
            <div className="flex justify-around items-end h-[160px] pb-2 relative z-10 w-full">
              {benchmarkResult.map((stat, idx) => {
                const mutexVal = activeTab === 'throughput' ? stat.mutexThroughput : stat.mutexLatency;
                const lfVal = activeTab === 'throughput' ? stat.lockFreeThroughput : stat.lockFreeLatency;
                const maxVal = activeTab === 'throughput' ? maxThroughput : maxLatency;

                const mutexHeight = Math.min(100, Math.max(10, (mutexVal / maxVal) * 100));
                const lfHeight = Math.min(100, Math.max(4, (lfVal / maxVal) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-16">
                    <div className="flex gap-1 items-end h-[120px]">
                      {/* Mutex bar */}
                      <div 
                        style={{ height: `${mutexHeight}%` }} 
                        className="w-4 bg-gradient-to-t from-red-950 to-red-500 border border-red-800 rounded-t-sm relative group"
                        title={`Mutex: ${mutexVal} ${activeTab === 'throughput' ? 'MB/s' : 'ms'}`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-black border border-slate-800 px-1 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          {mutexVal}
                        </div>
                      </div>
                      
                      {/* Lock-free bar */}
                      <div 
                        style={{ height: `${lfHeight}%` }} 
                        className="w-4 bg-gradient-to-t from-emerald-950 to-emerald-500 border border-[#10b981] rounded-t-sm relative group"
                        title={`Lock-Free: ${lfVal} ${activeTab === 'throughput' ? 'MB/s' : 'ms'}`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-black border border-slate-800 px-1 rounded text-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          {lfVal}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/40 pt-1.5 w-full text-center">
                      {stat.threads} Core{stat.threads > 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Info HUD */}
            <div className="flex justify-between items-center bg-[#1C232B]/60 border border-slate-800 rounded-lg p-3 pt-2 text-xs font-mono">
              <span className="text-[#10b981] flex items-center gap-1.5 font-bold">
                <Award className="w-4 h-4 animate-bounce" /> Scale: 3.4x Performance gain at 16 Cores !
              </span>
              <span className="text-slate-400">
                Memory Leak Pools: <span className="text-slate-200 font-bold">{memoryPoolKb} KB (Safe RAII recycled)</span>
              </span>
            </div>
          </div>

          {/* Hardened Explanatory Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#0F1419] border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="text-slate-200 font-bold flex items-center gap-1 border-b border-slate-850 pb-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-[#10b981]" /> MUTEX READ TRAJECTORY
              </div>
              <p className="text-slate-400 leading-relaxed font-sans text-xs">
                Mutex version obtains block exclusions on metadata indices of every file search. Thread context-switches and system locks spike under concurrency, dragging down core execution throughput.
              </p>
            </div>

            <div className="bg-[#0F1419] border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="text-slate-200 font-bold flex items-center gap-1 border-b border-slate-850 pb-1.5">
                <Zap className="w-4.5 h-4.5 text-yellow-500" /> LOCK-FREE CAS TRAJECTORY
              </div>
              <p className="text-slate-400 leading-relaxed font-sans text-xs">
                Utilizes standard C++ <span className="font-mono text-slate-300">std::atomic</span> compare-and-swap algorithms. Reads execute without locks, and traverse pointers concurrently, leaving CPU pipes completely unblocked.
              </p>
            </div>
          </div>

        </div>

        {/* Diagnostic Reports output */}
        <div id="thread-diagnostic-card" className="bg-[#0F1419] border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="text-yellow-600" />
            <span className="text-slate-400">CRYP-DAEMON REPORT: Ready, CPU scheduling threads allocation: <span className="text-[#10b981] font-bold">OK, NO DRIFT PRE-DETECTED</span></span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-[#10b981] px-2 py-0.5 rounded border border-emerald-800/40">
            SECURE MEM CLEAR ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
