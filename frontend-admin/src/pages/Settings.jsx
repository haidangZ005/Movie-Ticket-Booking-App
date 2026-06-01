import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const fallbackSettings = [
  { SettingID: 1, SettingKey: 'seat_hold_ttl_minutes', SettingValue: '10', Description: 'Thoi gian giu ghe tam thoi truoc thanh toan' },
  { SettingID: 2, SettingKey: 'cancellation_refund_before_hours', SettingValue: '24', Description: 'So gio toi thieu de duoc hoan tien khi huy ve' },
  { SettingID: 3, SettingKey: 'loyalty_points_rate', SettingValue: '1 point / 10000 VND', Description: 'Ty le tich diem khach hang' },
];

const Settings = () => {
  const [settings, setSettings] = useState(fallbackSettings);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/settings')
      .then((res) => setSettings(res.data?.items || res.data || fallbackSettings))
      .catch(() => setError('Backend settings chua san sang hoac tai khoan khong du quyen, dang hien thi cau hinh mau theo schema SystemSettings.'));
  }, []);

  return (
    <>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-text-primary">Settings</h2>
        <p className="mt-1 text-sm text-text-muted">Cấu hình hệ thống dành cho admin.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning">{error}</div>}

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-border-default bg-surface p-card-padding shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">System Settings</h3>
          <div className="space-y-3">
            {settings.map((setting) => (
              <div key={setting.SettingID || setting.SettingKey} className="rounded-lg border border-border-default bg-surface-container-low p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-semibold text-text-primary">{setting.SettingKey}</div>
                    <div className="mt-1 text-sm text-text-muted">{setting.Description || 'Chưa có mô tả'}</div>
                  </div>
                  <input className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:w-56" value={setting.SettingValue} readOnly />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
