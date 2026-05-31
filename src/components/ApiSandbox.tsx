import React, { useState, useEffect } from 'react';
import { Shield, Key, Eye, Lock, LayoutGrid, CheckCircle2, AlertTriangle, Send, RefreshCw, Terminal, Layers, Database, UserCheck } from 'lucide-react';
import { AuditLog, MetadataEntry } from '../types';

export default function ApiSandbox() {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ADMIN');
  const [targetEndpoint, setTargetEndpoint] = useState<string>('/api/audit');
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST' | 'DELETE'>('GET');
  const [requestPayload, setRequestPayload] = useState<string>('');
  const [jwtToken, setJwtToken] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<any>({});
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [rateLimitCount, setRateLimitCount] = useState(100);
  const [tokenColorStyle, setTokenColorStyle] = useState('text-sky-400');
  
  // Real active states of PostgreSQL table
  const [postgresFiles, setPostgresFiles] = useState<MetadataEntry[]>([
    { fileId: 'doc_001', owner: 'admin_ro', hash: '8a2b5e23c91a', size: 145000, timestamp: '2026-05-31 09:20 UTC', storageLocation: '/vault/chunks/8a' },
    { fileId: 'doc_002', owner: 'analyst_9', hash: 'bc3e28aa410b', size: 98020, timestamp: '2026-05-31 09:42 UTC', storageLocation: '/vault/chunks/bc' },
    { fileId: 'doc_003', owner: 'admin_ro', hash: 'b6f522deac41', size: 2310000, timestamp: '2026-05-31 10:15 UTC', storageLocation: '/vault/chunks/b6' },
  ]);

  const [postgresAuditLogs, setPostgresAuditLogs] = useState<AuditLog[]>([
    { id: 'uuid-1', timestamp: '2026-05-31 09:20:11', user: 'admin_ro', action: 'UPLOAD', resource: 'doc_001', status: 'SUCCESS', role: 'ADMIN', ip: '192.168.1.104' },
    { id: 'uuid-2', timestamp: '2026-05-31 10:22:45', user: 'viewer_sys', action: 'FAILED_LOGIN', resource: 'N/A', status: 'FAILED', role: 'VIEWER', ip: '10.0.4.15' },
    { id: 'uuid-3', timestamp: '2026-05-31 10:31:02', user: 'analyst_9', action: 'DOWNLOAD', resource: 'doc_002', status: 'SUCCESS', role: 'ANALYST', ip: '192.168.1.112' },
  ]);

  useEffect(() => {
    generateJwtToken();
  }, [selectedRole]);

  const generateJwtToken = () => {
    // Generate simulated standard JWT format
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: selectedRole === 'ADMIN' ? 'admin_root' : selectedRole === 'ANALYST' ? 'analyst_usr' : 'viewer_sys',
      role: `ROLE_${selectedRole}`,
      iss: "securevault-authority",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    const signature = "signature_gcm_auth_block_2026";
    const completeToken = `${header}.${payload}.${signature}`;
    setJwtToken(completeToken);
  };

  const handleApiRequest = () => {
    // Subtract rate limit capacity
    setRateLimitCount(prev => Math.max(0, prev - 1));

    const currentLogger = selectedRole === 'ADMIN' ? 'admin_root' : selectedRole === 'ANALYST' ? 'analyst_usr' : 'viewer_sys';
    const isIp = '192.168.1.' + Math.floor(Math.random() * 100 + 100);

    const logs: string[] = [];
    logs.push(`Client HTTP ${requestMethod} ${targetEndpoint} dispatched.`);
    logs.push("Authorization context parser checking bearer token signatures.");

    // Access control evaluation
    let hasAccess = false;
    
    // Security role bounds
    if (selectedRole === 'ADMIN') {
      hasAccess = true; // Admin has unilateral coverage
    } else if (selectedRole === 'ANALYST') {
      if (targetEndpoint.includes('/upload') || targetEndpoint.includes('/download') || targetEndpoint.includes('/metadata') || targetEndpoint.includes('/health')) {
        hasAccess = true;
      }
    } else { // VIEWER
      if (targetEndpoint.includes('/download') || targetEndpoint.includes('/metadata') || targetEndpoint.includes('/health')) {
        hasAccess = true;
      }
    }

    // Special verification on endpoint selection logic
    const methodMatches = (targetEndpoint === '/api/upload' && requestMethod === 'POST') ||
                         (targetEndpoint.startsWith('/api/download') && requestMethod === 'GET') ||
                         (targetEndpoint.startsWith('/api/file') && requestMethod === 'DELETE') ||
                         (targetEndpoint.startsWith('/api/metadata') && requestMethod === 'GET') ||
                         (targetEndpoint === '/api/audit' && requestMethod === 'GET') ||
                         (targetEndpoint === '/api/health' && requestMethod === 'GET');

    if (!methodMatches) {
      setApiResponse({ error: "HTTP Method Not Supported", status: 405 });
      setResponseHeaders({
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitCount - 1,
        'Server': 'Spring Boot Secure Engine'
      });
      logs.push("HTTP Request failed: 405 Method Not Allowed configuration.");
      setApiLogs(prev => [...prev, ...logs]);
      return;
    }

    if (!hasAccess) {
      // Access failure scenario
      setApiResponse({
        error: "Forbidden",
        message: "Access Denied: principal role credentials prevent execution of this database command mapping.",
        status: 403
      });
      setResponseHeaders({
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitCount - 1,
        'Server': 'Spring Boot Secure Engine'
      });

      // Inject failed audit log securely inside Postgres state mapping
      const newAudit: AuditLog = {
        id: `uuid-err-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        user: currentLogger,
        action: requestMethod + ' ' + targetEndpoint.replace('/api/', '').toUpperCase(),
        resource: targetEndpoint.split('/').slice(-1)[0] || 'N/A',
        status: 'FAILED',
        role: selectedRole,
        ip: isIp
      };
      setPostgresAuditLogs(prev => [newAudit, ...prev]);
      logs.push("Security Breach Exception: Spring Security filter chain intercepted unauthorized call. Logged in partitioned Postgres log.");
      setApiLogs(prev => [...prev, ...logs]);
      return;
    }

    // Success response mapping
    if (targetEndpoint === '/api/upload') {
      // Simulate database row addition
      const mockId = `doc_00${postgresFiles.length + 1}`;
      const newFile: MetadataEntry = {
        fileId: mockId,
        owner: currentLogger,
        hash: 'sha256_' + Math.random().toString(16).slice(2, 8),
        size: Math.floor(Math.random() * 500000) + 12000,
        timestamp: new Date().toUTCString(),
        storageLocation: `/vault/chunks/sc_${mockId}`
      };

      setPostgresFiles(prev => [...prev, newFile]);
      setApiResponse({
        fileId: mockId,
        status: "SUCCESS",
        metadata: "AES-256-GCM encrypted and chunked blocks mappings mapped securely."
      });

      const newAudit: AuditLog = {
        id: `uuid-su-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        user: currentLogger,
        action: 'UPLOAD',
        resource: mockId,
        status: 'SUCCESS',
        role: selectedRole,
        ip: isIp
      };
      setPostgresAuditLogs(prev => [newAudit, ...prev]);
      logs.push("Success: metadata mapping persisted in SQL index. Deduplication check completed.");

    } else if (targetEndpoint.startsWith('/api/download')) {
      const mockId = targetEndpoint.split('/').slice(-1)[0] || 'doc_001';
      const fileMatch = postgresFiles.find(f => f.fileId === mockId);
      
      if (fileMatch) {
        setApiResponse({
          payloadBase64: "SGVsbG9Xb3JsZF9TZWN1cmVWYXVsdF9GQUFOR1NERTNfR0NNX0FVVEg=",
          meta: fileMatch,
          integrityCheck: "SUCCESS (Hash matched stored SHA-256 state)"
        });
        
        const newAudit: AuditLog = {
          id: `uuid-dl-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toLocaleTimeString(),
          user: currentLogger,
          action: 'DOWNLOAD',
          resource: mockId,
          status: 'SUCCESS',
          role: selectedRole,
          ip: isIp
        };
        setPostgresAuditLogs(prev => [newAudit, ...prev]);
        logs.push("Success: chunks retrieved, authenticated via MAC, decrypting block...");
      } else {
        setApiResponse({ error: "File Not Found in directory trees", status: 404 });
        logs.push("Index lookup returned null values. Terminated search path.");
      }

    } else if (targetEndpoint.startsWith('/api/file')) {
      const mockId = targetEndpoint.split('/').slice(-1)[0] || 'doc_001';
      const exists = postgresFiles.find(f => f.fileId === mockId);
      
      if (exists) {
        setPostgresFiles(prev => prev.filter(f => f.fileId !== mockId));
        setApiResponse({ message: "Key block securely dereferenced and deleted from cluster schema mapping." });
        
        const newAudit: AuditLog = {
          id: `uuid-del-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toLocaleTimeString(),
          user: currentLogger,
          action: 'DELETE',
          resource: mockId,
          status: 'SUCCESS',
          role: selectedRole,
          ip: isIp
        };
        setPostgresAuditLogs(prev => [newAudit, ...prev]);
        logs.push("Success: Deleted files sector links and removed metadata database rows.");
      } else {
        setApiResponse({ error: "Target node not discovered", status: 404 });
      }

    } else if (targetEndpoint === '/api/audit') {
      setApiResponse(postgresAuditLogs);
      logs.push("Audit lookup complete. High-priority admin diagnostic trace generated.");

    } else if (targetEndpoint === '/api/health') {
      setApiResponse({
        status: "UP",
        cryptoEngine: "ONLINE",
        latchLockFrees: "OK",
        capacityEstimate: "98% FREE"
      });
      logs.push("System microservice reporting standard operations.");
    }

    setResponseHeaders({
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': 100,
      'X-RateLimit-Remaining': rateLimitCount - 1,
      'X-Content-Type-Options': 'nosniff',
      'Server': 'Spring Boot Secure Engine'
    });

    setApiLogs(prev => [...prev, ...logs]);
  };

  const handleEndpointSelect = (endpoint: string, method: 'GET' | 'POST' | 'DELETE') => {
    setTargetEndpoint(endpoint);
    setRequestMethod(method);
    if (endpoint === '/api/upload') {
      setRequestPayload('{\n  "fileName": "confidential_intel.pdf",\n  "owner": "admin_root"\n}');
    } else {
      setRequestPayload('');
    }
  };

  return (
    <div id="api-sandbox-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Endpoints & JWT Role Selector sidebar (Left) */}
      <div id="api-left-sidebar" className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Role Configs */}
        <div id="role-configs-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserCheck className="text-[#10b981] w-5 h-5" />
            <h3 className="font-semibold text-slate-100 tracking-tight">JWT Role Access Config</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-xs text-slate-400 font-mono">Select Testing Role Hierarchy</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ADMIN', 'ANALYST', 'VIEWER'] as const).map((role) => (
                <button 
                  key={role}
                  id={`role-btn-${role}`}
                  onClick={() => setSelectedRole(role)}
                  className={`text-xs px-2.5 py-2 font-mono font-bold rounded cursor-pointer transition-all border ${
                    selectedRole === role 
                      ? 'bg-[#10b981] text-[#0a0f1d] border-[#10b981] shadow-md shadow-[#10b981]/10' 
                      : 'bg-[#1C232B] text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic JWT Block display */}
          <div className="flex flex-col gap-1 z-10">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Active Signed Bearer Token</span>
            <div className="bg-[#0F1419] border border-slate-800 rounded p-3 font-mono text-[9px] leading-relaxed break-all select-all select-none max-h-[85px] overflow-y-auto w-full text-slate-400 select-all">
              <span className="text-[#ef4444]">{jwtToken.split('.')[0]}</span>.
              <span className="text-[#3b82f6]">{jwtToken.split('.')[1]}</span>.
              <span className="text-[#10b981]">{jwtToken.split('.')[2]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Header
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Payload (Claims)
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Sign (HMAC)
            </div>
          </div>
        </div>

        {/* Enterprise REST Endpoints catalogue */}
        <div id="rest-catalogue-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="text-xs uppercase text-slate-400 font-mono tracking-wider mb-1">REST API Endpoints</div>
          
          <div className="flex flex-col gap-2">
            {[
              { path: '/api/upload', method: 'POST' as const, label: 'Upload chunk block', roles: 'ADMIN, ANALYST' },
              { path: '/api/download/doc_001', method: 'GET' as const, label: 'Download block', roles: 'ALL ROLES' },
              { path: '/api/file/doc_001', method: 'DELETE' as const, label: 'Hard delete mappings', roles: 'ADMIN ONLY' },
              { path: '/api/audit', method: 'GET' as const, label: 'Read audit schema', roles: 'ADMIN ONLY' },
              { path: '/api/health', method: 'GET' as const, label: 'Query service status', roles: 'PUBLIC' },
            ].map((endpoint, idx) => (
              <button
                key={idx}
                id={`endpoint-catalog-item-${idx}`}
                onClick={() => handleEndpointSelect(endpoint.path, endpoint.method)}
                className={`flex items-start gap-2.5 p-2 rounded text-left transition-colors cursor-pointer border ${
                  targetEndpoint === endpoint.path && requestMethod === endpoint.method
                    ? 'bg-[#1C232B] border-[#10b981]/50 text-[#10b981]' 
                    : 'bg-[#0F1419]/40 border-transparent hover:bg-[#1C232B]/85'
                }`}
              >
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono min-w-[50px] text-center ${
                  endpoint.method === 'POST' ? 'bg-emerald-950 text-emerald-400' :
                  endpoint.method === 'DELETE' ? 'bg-red-950 text-red-400' : 'bg-blue-950 text-blue-400'
                }`}>
                  {endpoint.method}
                </span>
                
                <div className="flex-1 font-mono text-[11px]">
                  <div className="text-slate-200 break-all">{endpoint.path}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 font-sans flex items-center justify-between">
                    <span>{endpoint.label}</span>
                    <span className="font-mono text-slate-400 font-semibold">{endpoint.roles}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* API Console & PostgreSQL State Views (Right Column) */}
      <div id="api-right-view" className="lg:col-span-8 flex flex-col gap-6">
        
        {/* API Playground Client Request block */}
        <div id="rest-client-card" className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          
          {/* Header REST UI */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-100 font-semibold tracking-tight flex items-center gap-1">
              <Terminal className="text-[#10b981] w-5 h-5" /> Spring Boot Custom REST Interactive Client
            </span>
            
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Token Bucket Rate:</span>
              <span className={`font-bold ${rateLimitCount < 20 ? 'text-red-400' : 'text-[#10b981]'}`}>{rateLimitCount} / 100</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <div className="bg-[#0F1419] border border-slate-800 px-3.5 py-1.5 rounded font-mono text-xs text-sky-400 font-bold flex items-center select-none font-semibold">
              {requestMethod}
            </div>
            
            <input 
              id="rest-client-endpoint-input"
              type="text" 
              value={targetEndpoint || ""} 
              onChange={(e) => setTargetEndpoint(e.target.value)}
              className="flex-1 bg-[#0F1419] border border-slate-800 px-3 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#10b981]"
            />
            
            <button 
              id="fire-rest-request-btn"
              onClick={handleApiRequest}
              className="bg-[#10b981] hover:bg-[#059669] text-[#0a0f1d] font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors shadow-md"
            >
              <Send className="w-3.5 h-3.5" /> SEND
            </button>
          </div>

          {/* Request Payload conditional input */}
          {requestPayload && (
            <textarea
              id="rest-payload-json"
              value={requestPayload}
              onChange={(e) => setRequestPayload(e.target.value)}
              rows={2}
              className="w-full bg-[#0F1419] border border-slate-800 p-2.5 rounded font-mono text-[10px] text-slate-400 focus:outline-[#10b981] leading-relaxed resize-none"
            />
          )}

          {/* Output responses */}
          {apiResponse && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-slate-800/60 pt-4">
              
              {/* Response Headers */}
              <div className="md:col-span-5 flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Response Headers</span>
                <div className="bg-[#0F1419] border border-slate-800 rounded p-3 text-[10px] font-mono text-slate-400 space-y-1.5 max-h-[160px] overflow-y-auto">
                  {Object.entries(responseHeaders).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-800/20 pb-1 border-dotted">
                      <span className="text-[#10b981] font-semibold">{k}:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[124px]">{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Body JSON */}
              <div className="md:col-span-7 flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Response JSON Payload</span>
                <pre className="bg-[#0F1419] border border-slate-800 rounded p-3 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-[160px] leading-relaxed select-all">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Live Postgres table mappings (under interactions) */}
        <div id="postgres-state-view" className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 justify-between">
            <span className="text-slate-100 font-semibold text-sm tracking-tight flex items-center gap-1">
              <Database className="text-[#3b82f6] w-5 h-5" /> PostgreSQL File Metadata State (`file_metadata`)
            </span>
            <span className="text-[10px] font-mono bg-blue-950/40 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded">
              SQL SCHEMAS ACTIVE
            </span>
          </div>

          <div id="postgres-files-table" className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="py-2.5 px-3">file_id</th>
                  <th className="py-2.5 px-3">owner_id</th>
                  <th className="py-2.5 px-3">file_sha256</th>
                  <th className="py-2.5 px-3">size_bytes</th>
                  <th className="py-2.5 px-3">location_lnk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 select-all">
                {postgresFiles.map((file, fIdx) => (
                  <tr key={fIdx} className="hover:bg-slate-900/30">
                    <td className="py-2 px-3 text-[#10b981] font-bold">{file.fileId}</td>
                    <td className="py-2 px-3 text-slate-400">{file.owner}</td>
                    <td className="py-2 px-3 text-[#3b82f6]">{file.hash.slice(0, 12)}...</td>
                    <td className="py-2 px-3 font-semibold">{file.size.toLocaleString()} B</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">{file.storageLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Immutable Postgres Audit list */}
        <div id="postgres-audit-view" className="bg-[#0F1419] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="text-[#ef4444] w-5 h-5" />
              <h3 className="font-semibold text-slate-100 tracking-tight">PostgreSQL Partitioned Immutable Audit Trail</h3>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse"></span>
          </div>

          <div id="postgres-audit-table" className="max-h-[175px] overflow-y-auto w-full">
            <table className="w-full text-left border-collapse text-[10px] font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2 px-3">Recorded At</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Target</th>
                  <th className="py-2 px-3">State</th>
                  <th className="py-2 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-slate-400 select-all">
                {postgresAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 truncate text-slate-500">{log.timestamp}</td>
                    <td className="py-1.5 px-3 font-semibold text-slate-300">{log.user}</td>
                    <td className="py-1.5 px-3 text-slate-450">{log.role}</td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded-sm font-bold uppercase text-[8px] ${
                        log.action === 'UPLOAD' ? 'bg-emerald-950/40 text-emerald-400' :
                        log.action === 'DOWNLOAD' ? 'bg-blue-950/40 text-blue-400' : 'bg-red-950/40 text-red-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-[#10b981]">{log.resource}</td>
                    <td className="py-1.5 px-3">
                      <span className={`font-semibold ${log.status === 'SUCCESS' ? 'text-[#10b981]' : 'text-red-400'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-600">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
