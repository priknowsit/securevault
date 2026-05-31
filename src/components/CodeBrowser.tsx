import React, { useState } from 'react';
import { FileCode, Clipboard, Check, ChevronRight, Folder, FolderOpen, Terminal, Download, FileText, CheckCircle2 } from 'lucide-react';
import { SECUREVAULT_CODEBANK, CodeFile } from '../securevault_codebank';

export default function CodeBrowser() {
  const [activeFile, setActiveFile] = useState<CodeFile>(SECUREVAULT_CODEBANK[0]);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'cpp' | 'backend' | 'configs'>('cpp');

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Group our file bank logically
  const cppFiles = SECUREVAULT_CODEBANK.filter(file => file.path.startsWith('core/'));
  const javaFiles = SECUREVAULT_CODEBANK.filter(file => file.path.startsWith('backend/'));
  const configFiles = SECUREVAULT_CODEBANK.filter(file => !file.path.startsWith('core/') && !file.path.startsWith('backend/'));

  return (
    <div id="codebrowser-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* Category Selection and File Paths list (Left column) */}
      <div id="codebrowser-sidebar" className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Category Tabs */}
        <div id="categories-tabs" className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 shadow-xl flex flex-col gap-2">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest px-1">Select Module Component</span>
          
          <div className="flex gap-2.5">
            <button 
              id="cat-btn-cpp"
              onClick={() => setActiveCategory('cpp')}
              className={`flex-1 text-xs py-2 font-mono font-bold rounded cursor-pointer border transition-all ${
                activeCategory === 'cpp' 
                  ? 'bg-[#10b981] text-[#0f172a] border-emerald-500 shadow-md shadow-[#10b981]/10' 
                  : 'bg-[#111827] text-slate-400 hover:text-slate-200 border-[#1e293b]'
              }`}
            >
              C++ Core
            </button>
            <button 
              id="cat-btn-backend"
              onClick={() => setActiveCategory('backend')}
              className={`flex-1 text-xs py-2 font-mono font-bold rounded cursor-pointer border transition-all ${
                activeCategory === 'backend' 
                  ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/10' 
                  : 'bg-[#111827] text-slate-400 hover:text-slate-200 border-[#1e293b]'
              }`}
            >
              Java API
            </button>
            <button 
              id="cat-btn-configs"
              onClick={() => setActiveCategory('configs')}
              className={`flex-1 text-xs py-2 font-mono font-bold rounded cursor-pointer border transition-all ${
                activeCategory === 'configs' 
                  ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/10' 
                  : 'bg-[#111827] text-slate-400 hover:text-slate-200 border-[#1e293b]'
              }`}
            >
              Configs
            </button>
          </div>
        </div>

        {/* Dynamic File Paths Tree list */}
        <div id="filepaths-tree-card" className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-xl flex flex-col gap-2">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>REPOSITORY FILE MANAGER</span>
            <span className="text-[11px] font-bold text-slate-300">/securevault</span>
          </div>

          <div id="filepaths-group-list" className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
            {/* C++ Files grouped */}
            {activeCategory === 'cpp' && (
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase mb-1 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" /> /core
                </div>
                {cppFiles.map((file) => (
                  <button
                    key={file.path}
                    id={`file-btn-${file.name}`}
                    onClick={() => {
                      setActiveFile(file);
                      setCopied(false);
                    }}
                    className={`flex items-center gap-2 py-2 px-3 rounded text-left font-mono text-[11px] transition-colors cursor-pointer border ${
                      activeFile.path === file.path 
                        ? 'bg-[#1e293b] text-[#10b981] border-[#10b981]/50 shadow-sm' 
                        : 'bg-[#111827]/40 border-transparent hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <FileCode className={`${activeFile.path === file.path ? 'text-[#10b981]' : 'text-slate-500'} w-4 h-4`} />
                    <span className="truncate">{file.path.replace('core/', '')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Java Files grouped */}
            {activeCategory === 'backend' && (
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase mb-1 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" /> /backend/springboot
                </div>
                {javaFiles.map((file) => (
                  <button
                    key={file.path}
                    id={`file-btn-${file.name}`}
                    onClick={() => {
                      setActiveFile(file);
                      setCopied(false);
                    }}
                    className={`flex items-center gap-2 py-2 px-3 rounded text-left font-mono text-[11px] transition-colors cursor-pointer border ${
                      activeFile.path === file.path 
                        ? 'bg-[#1e293b] text-blue-400 border-blue-900/50 shadow-sm' 
                        : 'bg-[#111827]/40 border-transparent hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <FileCode className={`${activeFile.path === file.path ? 'text-blue-400' : 'text-slate-500'} w-4 h-4`} />
                    <span className="truncate">{file.path.split('/').slice(-1)[0]}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Config files grouped */}
            {activeCategory === 'configs' && (
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase mb-1 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" /> root configurations
                </div>
                {configFiles.map((file) => (
                  <button
                    key={file.path}
                    id={`file-btn-${file.name}`}
                    onClick={() => {
                      setActiveFile(file);
                      setCopied(false);
                    }}
                    className={`flex items-center gap-2 py-2 px-3 rounded text-left font-mono text-[11px] transition-colors cursor-pointer border ${
                      activeFile.path === file.path 
                        ? 'bg-[#1e293b] text-purple-400 border-purple-900/50 shadow-sm' 
                        : 'bg-[#111827]/40 border-transparent hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    {file.name.endsWith('.sql') || file.name.endsWith('.md') ? (
                      <FileText className={`${activeFile.path === file.path ? 'text-purple-400' : 'text-slate-500'} w-3.5 h-3.5`} />
                    ) : (
                      <FileCode className={`${activeFile.path === file.path ? 'text-purple-400' : 'text-slate-500'} w-3.5 h-3.5`} />
                    )}
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Export actions */}
        <div id="export-package-card" className="bg-gradient-to-r from-emerald-950/20 to-emerald-900/10 border border-emerald-800/40 rounded-xl p-5 shadow-xl flex flex-col gap-3">
          <div className="text-xs text-slate-300 font-semibold font-mono flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Workspace Deploy Verified
          </div>
          <p className="text-xs text-slate-400 leading-normal font-sans">
            Every file shown here actually exists as a physical source file inside the workspace root under `/securevault/`! You can compile them natively on your infrastructure.
          </p>
        </div>

      </div>

      {/* Code Reader Terminal Display panel (Right Column) */}
      <div id="codebrowser-terminal" className="lg:col-span-8 flex flex-col gap-6">
        <div id="terminal-card" className="bg-[#090d16] border border-[#1e293b] rounded-xl flex flex-col overflow-hidden shadow-2xl relative">
          
          {/* Header Panel */}
          <div className="bg-[#020617] border-b border-[#1e293b] px-4 py-3.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-400 font-mono font-bold ml-2 truncate max-w-[200px]">
                /securevault/{activeFile.path}
              </span>
            </div>

            <button 
              id="copy-terminal-content"
              onClick={handleCopy}
              className="bg-[#1e293b] border border-[#334155]/60 hover:bg-slate-800 text-slate-200 text-xs font-mono px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10b981]" /> Copied!
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          {/* Code Textbox view */}
          <div className="p-5 overflow-x-auto overflow-y-auto max-h-[460px] min-h-[300px]">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed max-w-full select-all">
              <code>{activeFile.content}</code>
            </pre>
          </div>

        </div>
      </div>

    </div>
  );
}
