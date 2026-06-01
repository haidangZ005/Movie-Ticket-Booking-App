import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const Logs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [error, setError] = useState('');

  const fetchLogs = () => {
    apiClient.get('/admin/audit-logs')
      .then((res) => setAuditLogs(res.data?.data || res.data?.items || res.data || []))
      .catch(() => setError('Không thể tải Audit Logs hoặc không đủ quyền.'));

    apiClient.get('/admin/system-logs')
      .then((res) => setSystemLogs(res.data?.data || res.data || []))
      .catch(() => setError('Không thể tải System Logs.'));
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-text-primary">Logs Hệ Thống</h2>
        <p className="mt-1 text-sm text-text-muted">Xem nhật ký thao tác (Audit Logs) và Terminal Logs của backend.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning">{error}</div>}

      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-border-default bg-surface p-card-padding shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">Audit Logs</h3>
          {auditLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-default bg-surface-container-low p-4 text-sm text-text-muted">
              Chưa có dữ liệu audit log hoặc chỉ SUPER_ADMIN mới xem được.
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.slice(0, 50).map((log, index) => (
                <div key={log.LogID || index} className="rounded-lg bg-surface-container-low p-3">
                  <div className="font-semibold text-text-primary">{log.Action} by {log.AccountName || log.AccountID}</div>
                  <div className="text-xs text-text-muted">{log.TableName} #{log.RecordID} - {new Date(log.CreatedAt).toLocaleString('vi-VN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border-default bg-surface p-card-padding shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">Live System Activity</h3>
          <div className="rounded-lg bg-[#1e1e1e] p-4 text-sm text-[#00ff00] font-mono h-[400px] overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all">
            {systemLogs.length === 0 ? (
              <span className="text-gray-500">Đang chờ log...</span>
            ) : (
              systemLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Logs;
