'use client';
import { trpc } from "../../../../lib/trpc";
import React, { useState } from "react";
import { FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SourcesPage() {
  const utils = trpc.useContext();
  const sources = trpc.sources.list.useQuery();
  const documents = trpc.sources.listDocuments.useQuery();
  
  const upload = trpc.sources.upload.useMutation({
      onSuccess: () => {
          utils.sources.list.invalidate();
          utils.sources.listDocuments.invalidate();
          alert("File queued for ingestion!");
      }
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          upload.mutate({
              fileName: file.name,
              contentBase64: base64
          });
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Data Sources</h1>
      
      {/* Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/50 transition">
          <h3 className="font-bold mb-2 text-lg">Manual Upload</h3>
          <p className="text-sm text-slate-400 mb-6">Upload PDF, TXT, MD files directly.</p>
          <label className={`block w-full text-center py-2.5 rounded-lg cursor-pointer font-medium transition ${upload.isLoading ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {upload.isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin"/> Uploading...</span>
            ) : 'Choose File'}
            <input type="file" onChange={handleFile} disabled={upload.isLoading} className="hidden"/>
          </label>
        </div>
        
        {['Google Drive', 'Slack'].map(name => (
          <div key={name} className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 opacity-60">
            <h3 className="font-bold mb-2 text-lg">{name}</h3>
            <p className="text-sm text-slate-500 mb-6">Connect workspace</p>
            <button disabled className="w-full py-2.5 bg-slate-800 rounded-lg text-slate-500 text-sm font-medium cursor-not-allowed">Coming Soon</button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Sources Table */}
          <div className="space-y-4">
              <h2 className="text-xl font-bold">Connected Sources</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                          <tr>
                              <th className="p-4">Name</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Docs</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                          {sources.data?.map((s: any) => (
                              <tr key={s.id} className="hover:bg-slate-800/50 transition">
                                  <td className="p-4 font-medium">
                                      {s.displayName}
                                      <div className="text-xs text-slate-500 font-normal">{s.type}</div>
                                  </td>
                                  <td className="p-4">
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                                          s.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                      }`}>
                                          <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                          {s.status}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right text-slate-300 font-mono">{s._count.documents}</td>
                              </tr>
                          ))}
                          {sources.data?.length === 0 && (
                              <tr><td colSpan={3} className="p-6 text-center text-slate-500 text-sm">No sources connected</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Recent Documents Table */}
          <div className="space-y-4">
              <h2 className="text-xl font-bold">Recent Documents</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                          <tr>
                              <th className="p-4">Document</th>
                              <th className="p-4">Date</th>
                              <th className="p-4 text-right">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                          {documents.data?.map((d: any) => (
                              <tr key={d.id} className="hover:bg-slate-800/50 transition">
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-800 rounded text-slate-400">
                                              <FileText size={16} />
                                          </div>
                                          <div className="overflow-hidden">
                                              <div className="font-medium truncate max-w-[150px]" title={d.title}>{d.title}</div>
                                              <div className="text-xs text-slate-500 truncate">{d.sourceName}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4 text-sm text-slate-400">
                                      {new Date(d.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="p-4 text-right">
                                      {d.status === 'ACTIVE' && <CheckCircle size={18} className="text-green-500 inline" />}
                                      {d.status === 'INDEXING' && <Loader2 size={18} className="text-blue-500 animate-spin inline" />}
                                      {(d.status === 'PENDING' || d.status === 'ERROR') && <AlertCircle size={18} className="text-slate-500 inline" />}
                                  </td>
                              </tr>
                          ))}
                          {documents.data?.length === 0 && (
                              <tr><td colSpan={3} className="p-6 text-center text-slate-500 text-sm">No documents found</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
}