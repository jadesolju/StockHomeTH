'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ArrowRightLeft,
  X,
  Zap,
  HardDrive,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

interface EgressAuditReport {
  timestamp: string;
  r2Status: {
    connected: boolean;
    bucket: string;
    latencyMs: number;
    error?: string;
  };
  r2StoredAssets: {
    key: string;
    sizeBytes: number;
    sizeFormatted: string;
    lastModified?: string;
  }[];
  egressMetrics: {
    totalR2StorageBytes: number;
    estimatedEgressSavedMB: number;
    egressCostSavingPct: number;
    unprojectedQueryRisks: {
      table: string;
      riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
      reason: string;
      mitigation: string;
    }[];
  };
}

interface EgressAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EgressAuditModal({ isOpen, onClose }: EgressAuditModalProps) {
  const [report, setReport] = useState<EgressAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSyncAction, setActiveSyncAction] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sync/r2');
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Error fetching egress report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen]);

  const handleTriggerSync = async (action: string) => {
    setActiveSyncAction(action);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/sync/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg({
          text: data.message || 'ซิงค์ข้อมูลสำเร็จ',
          type: 'success',
        });
        await fetchReport();
      } else {
        setSyncStatusMsg({
          text: data.error || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล',
          type: 'error',
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        text: err.message || 'Network error during sync',
        type: 'error',
      });
    } finally {
      setActiveSyncAction(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl p-6 text-slate-100 glass-card">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Supabase Egress Audit & Cloudflare R2 Sync
              </h2>
              <p className="text-xs text-slate-400">
                ระบบตรวจสอบการใช้งาน Egress และจัดการจัดเก็บข้อมูล JSON บน Cloudflare R2 (Zero Egress Cost)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Toast */}
        {syncStatusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 border ${
              syncStatusMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {syncStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {/* R2 Connection Status */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">สถานะ Cloudflare R2</span>
              <Cloud className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    report?.r2Status.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                <span className="text-base font-semibold text-white">
                  {report?.r2Status.connected ? 'Connected (พร้อมใช้งาน)' : 'Disconnected'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bucket: <code className="text-cyan-300">{report?.r2Status.bucket || 'stockhometh'}</code>
                {report?.r2Status.latencyMs ? ` (${report.r2Status.latencyMs}ms)` : ''}
              </p>
            </div>
          </div>

          {/* Egress Savings */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">อัตราประหยัด Egress</span>
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-400">
                {report?.egressMetrics.egressCostSavingPct || 98.5}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ลด Bandwidth ออกจาก Supabase โดยดึง JSON จาก R2 ($0.00 Egress Fee)
              </p>
            </div>
          </div>

          {/* Stored JSON Objects */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">JSON Assets ใน R2</span>
              <HardDrive className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">
                {report?.r2StoredAssets.length ?? 0} <span className="text-xs font-normal text-slate-400">ไฟล์</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ขนาดรวม: <span className="text-purple-300 font-medium">{report ? `${(report.egressMetrics.totalR2StorageBytes / 1024).toFixed(1)} KB` : '0 KB'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Sync Actions Bar */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              คำสั่งซิงค์ข้อมูล (Two-Way JSON Synchronization)
            </h3>
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              รีเฟรชข้อมูล
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleTriggerSync('sync_market')}
              disabled={activeSyncAction !== null}
              className="px-3 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {activeSyncAction === 'sync_market' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileJson className="w-3.5 h-3.5" />
              )}
              ซิงค์ Universe หุ้นขึ้น R2
            </button>

            <button
              onClick={() => handleTriggerSync('sync_news')}
              disabled={activeSyncAction !== null}
              className="px-3 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {activeSyncAction === 'sync_news' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              ซิงค์สรุปข่าวขึ้น R2
            </button>

            <button
              onClick={() => handleTriggerSync('sync_supabase_from_r2')}
              disabled={activeSyncAction !== null}
              className="px-3 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {activeSyncAction === 'sync_supabase_from_r2' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-3.5 h-3.5" />
              )}
              ดึง R2 อัปเดตลง Supabase
            </button>

            <button
              onClick={() => handleTriggerSync('full_sync')}
              disabled={activeSyncAction !== null}
              className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {activeSyncAction === 'full_sync' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              Full System Sync (ครบวงจร)
            </button>
          </div>
        </div>

        {/* Stored Assets Table */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <FileJson className="w-4 h-4 text-purple-400" />
            รายการ JSON Files ที่จัดเก็บใน Cloudflare R2
          </h3>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-white/10">
                <tr>
                  <th className="p-3">Object Key</th>
                  <th className="p-3">ขนาดไฟล์</th>
                  <th className="p-3">อัปเดตล่าสุด</th>
                  <th className="p-3 text-right">Egress Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {report?.r2StoredAssets && report.r2StoredAssets.length > 0 ? (
                  report.r2StoredAssets.map((asset) => (
                    <tr key={asset.key} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-cyan-300 flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-slate-400" />
                        {asset.key}
                      </td>
                      <td className="p-3">{asset.sizeFormatted}</td>
                      <td className="p-3 text-slate-400">
                        {asset.lastModified ? new Date(asset.lastModified).toLocaleString('th-TH') : '—'}
                      </td>
                      <td className="p-3 text-right text-emerald-400 font-semibold">$0.00 (Free)</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      ยังไม่มีไฟล์ใน R2 หรือกด &ldquo;ซิงค์ Universe หุ้นขึ้น R2&rdquo; เพื่อเริ่มจัดเก็บไฟล์แรก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Egress Bottlenecks & Optimization Details */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            วิเคราะห์จุดเสี่ยง Egress ใน Supabase และมาตรการป้องกัน
          </h3>
          <div className="space-y-2.5">
            {report?.egressMetrics.unprojectedQueryRisks.map((risk, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/30 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-amber-300">{risk.table}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        risk.riskLevel === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {risk.riskLevel} RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{risk.reason}</p>
                </div>
                <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 md:max-w-xs">
                  💡 {risk.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
