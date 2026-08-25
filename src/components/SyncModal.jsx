import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Database, Check, Copy, RefreshCw, ExternalLink, Sparkles, FileSpreadsheet } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { googleSheetsSync } from '../utils/googleSheetsSync';

export function SyncModal({ isOpen, onClose, onSyncSuccess, currentCount }) {
  const [endpoint, setEndpoint] = useState(googleSheetsSync.getEndpoint());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'script'

  if (!isOpen) return null;

  const handleSaveAndSync = async () => {
    soundEngine.playClick();
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      googleSheetsSync.setEndpoint(endpoint);
      const data = await googleSheetsSync.fetchFromEndpoint(endpoint);
      if (data && data.length > 0) {
        setSyncStatus({ success: true, message: `Berhasil sinkronisasi ${data.length} media dari Google Sheets!` });
        if (onSyncSuccess) onSyncSuccess(data);
      } else {
        setSyncStatus({ success: true, message: `Tersimpan! Menggunakan fallback data Google Drive lokal.` });
      }
    } catch (err) {
      setSyncStatus({ success: false, message: `Gagal terhubung: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyScript = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(googleSheetsSync.getAppsScriptTemplate());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl glass-panel-elevated rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight font-serif">
                Serverless Google Sheets Sync
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Sinkronisasi database media langsung dari Google Sheets
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 px-6 bg-neutral-950/40">
          <button
            onClick={() => { soundEngine.playClick(); setActiveTab('settings'); }}
            className={`py-3 px-4 text-xs font-mono border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Endpoint URL & Status
          </button>
          <button
            onClick={() => { soundEngine.playClick(); setActiveTab('script'); }}
            className={`py-3 px-4 text-xs font-mono border-b-2 transition-all ${
              activeTab === 'script'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Apps Script Code (Code.gs)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'settings' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Database Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live ({currentCount} Items Loaded)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Web galeri otomatis memuat 235 foto & video dari Google Drive lokal Anda. Jika Anda ingin menambah foto baru langsung dari HP via Google Spreadsheet, masukkan URL Web App Apps Script di bawah.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-2">
                  Google Apps Script Web App Endpoint URL
                </label>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-neutral-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-sky-400 font-mono"
                />
              </div>

              {syncStatus && (
                <div className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2 border ${
                  syncStatus.success 
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
                    : 'bg-red-950/40 text-red-300 border-red-500/30'
                }`}>
                  {syncStatus.success ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span>{syncStatus.message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-300 font-mono">
                  Salin kode ini ke Google Apps Script (Extensions &gt; Apps Script):
                </p>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-xs font-mono text-neutral-300 hover:text-white hover:border-white/30 transition-all"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Tersalin!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-neutral-950 border border-white/10 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-60 leading-relaxed">
                {googleSheetsSync.getAppsScriptTemplate()}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 bg-neutral-950/40 flex items-center justify-between">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono text-neutral-400 hover:text-white transition-all"
          >
            Tutup
          </button>

          {activeTab === 'settings' && (
            <button
              onClick={handleSaveAndSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menghubungkan...' : 'Simpan & Sync'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
