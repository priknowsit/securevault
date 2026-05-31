import React, { useState } from 'react';
import { 
  Shield, 
  Layers, 
  Cpu, 
  Database, 
  Terminal, 
  FolderLock, 
  Gauge, 
  HardDrive, 
  UserCheck, 
  Sparkles,
  Search,
  BookOpen,
  Activity,
  AlertOctagon,
  Download
} from 'lucide-react';
import CryptoSandbox from './components/CryptoSandbox';
import BTreeSandbox from './components/BTreeSandbox';
import ThreadSandbox from './components/ThreadSandbox';
import ApiSandbox from './components/ApiSandbox';
import ArchitectureView from './components/ArchitectureView';
import CodeBrowser from './components/CodeBrowser';

export default function App() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'btree' | 'threading' | 'api' | 'architecture' | 'code'>('crypto');

  return (
    <div className="min-h-screen bg-[#0B0F13] text-slate-300 flex flex-col font-sans selection:bg-[#10b981] selection:text-[#0a0f1d]">
      
      {/* Visual Identity & Masthead Header */}
      <header id="app-masthead" className="bg-[#0F1419] border-b border-slate-800 py-4 px-6 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 rounded-xl">
              <FolderLock className="w-6 h-6 text-[#10b981] animate-pulse-soft" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">SECUREVAULT</h1>
                <span className="text-[10px] font-mono bg-emerald-950 text-[#10b981] border border-emerald-800/40 px-2 py-0.5 rounded font-bold">CORE-v3.0</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">High-Performance Cryptographic Storage Engine Kernel</p>
            </div>
          </div>

          {/* Quick HUD Metrics trackers */}
          <div id="quick-hud-metrics" className="flex items-center gap-6 text-xs font-mono">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[9px] text-slate-500 uppercase">Engine Latency</span>
              <span className="text-slate-200 font-bold flex items-center justify-end gap-1"><Gauge className="w-3.5 h-3.5 text-blue-400" /> 0.04μs (Max)</span>
            </div>
            <div className="hidden sm:flex flex-col text-right border-l border-slate-800 pl-5">
              <span className="text-[9px] text-slate-500 uppercase">De-Duplication Rate</span>
              <span className="text-[#10b981] font-bold flex items-center justify-end gap-1"><HardDrive className="w-3.5 h-3.5" /> 33% Storage Savings</span>
            </div>
            <div className="flex flex-col text-right border-l border-slate-800 pl-5">
              <span className="text-[9px] text-slate-500 uppercase">Kernel Status</span>
              <span className="text-[#10b981] font-bold flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span> SECURE_COMM
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Primary Tab Navigation links */}
      <nav id="app-nav-bar" className="bg-[#0F1419] border-b border-slate-800 overflow-x-auto scrollbar-none sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto px-6 flex">
          {[
            { id: 'crypto' as const, label: 'Encryption & PBKDF2', icon: Shield },
            { id: 'btree' as const, label: 'B-Tree Metadata', icon: Database },
            { id: 'threading' as const, label: 'Thread Concurrency', icon: Cpu },
            { id: 'api' as const, label: 'Spring API & RBAC', icon: Terminal },
            { id: 'architecture' as const, label: 'System Design Coach', icon: Sparkles },
            { id: 'code' as const, label: 'Source File Manager', icon: Layers },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'border-[#10b981] text-[#10b981] bg-emerald-950/20' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main id="app-workspace-body" className="flex-1 py-8 px-6 max-w-7xl mx-auto w-full">
        {activeTab === 'crypto' && <CryptoSandbox />}
        {activeTab === 'btree' && <BTreeSandbox />}
        {activeTab === 'threading' && <ThreadSandbox />}
        {activeTab === 'api' && <ApiSandbox />}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'code' && <CodeBrowser />}
      </main>

      {/* Footer Branding Area */}
      <footer id="app-footer-brand" className="bg-[#0F1419] border-t border-slate-800 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SECUREVAULT storage architecture daemon. Verified for Google & Cloudflare core storage layers.</p>
          <div className="flex gap-4">
            <span className="text-slate-400 font-bold">AES-256-GCM / PBKDF2 Enabled</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 font-bold">Lock-Free Reads Traversals Trajectory</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
