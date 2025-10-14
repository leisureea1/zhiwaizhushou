import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import ApiService from '../services/api';

interface NotificationSettings {
  bark_enabled?: { value: string; description: string };
  bark_key?: { value: string; description: string };
  bark_server?: { value: string; description: string };
  bark_notify_flea_market?: { value: string; description: string };
  bark_notify_lost_found?: { value: string; description: string };
  bark_sound?: { value: string; description: string };
  bark_group?: { value: string; description: string };
}

export function NotificationManagement() {
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getNotificationSettings();
      setSettings(data.data || {});
    } catch (error) {
      console.error('获取通知配置失败:', error);
      setMessage({ type: 'error', text: '获取通知配置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const settingsToSave: Record<string, string> = {};
      Object.keys(settings).forEach(key => {
        settingsToSave[key] = settings[key as keyof NotificationSettings]?.value || '';
      });

      await ApiService.updateNotificationSettings({ settings: settingsToSave });
      setMessage({ type: 'success', text: '通知配置保存成功' });
    } catch (error) {
      console.error('保存通知配置失败:', error);
      setMessage({ type: 'error', text: '保存通知配置失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setMessage(null);

      const data = await ApiService.testBarkNotification();
      if (data.success) {
        setMessage({ type: 'success', text: 'Bark 测试通知已发送，请检查你的设备' });
      } else {
        setMessage({ type: 'error', text: 'Bark 测试失败，请检查配置是否正确' });
      }
    } catch (error) {
      console.error('测试 Bark 通知失败:', error);
      setMessage({ type: 'error', text: 'Bark 测试失败，请检查配置' });
    } finally {
      setTesting(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof NotificationSettings],
        value
      }
    }));
  };

  const getSoundOptions = () => [
    { value: 'bell', label: '铃铛 (bell)' },
    { value: 'alarm', label: '警报 (alarm)' },
    { value: 'anticipate', label: '期待 (anticipate)' },
    { value: 'bloom', label: '绽放 (bloom)' },
    { value: 'calypso', label: '卡利普索 (calypso)' },
    { value: 'chime', label: '钟声 (chime)' },
    { value: 'chord', label: '和弦 (chord)' },
    { value: 'pulse', label: '脉冲 (pulse)' },
    { value: 'silence', label: '静音 (silence)' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">通知管理</h1>
        <p className="text-gray-600 mt-2">配置 Bark 推送通知，在有新内容发布时及时提醒管理员</p>
      </div>

      {/* 消息提示 */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Bark 基本配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bark 基本配置</CardTitle>
              <CardDescription className="mt-1">
                Bark 是一款 iOS 推送通知工具。
                <a 
                  href="https://github.com/Finb/Bark" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-2"
                >
                  查看文档 →
                </a>
              </CardDescription>
            </div>
            <Badge variant={settings.bark_enabled?.value === '1' ? 'default' : 'secondary'}>
              {settings.bark_enabled?.value === '1' ? '已启用' : '已禁用'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="space-y-1">
              <Label className="text-base font-medium">Bark 通知状态</Label>
              <div className="text-sm text-gray-500">
                开启后，当有新内容发布时会向你的设备推送通知
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant={settings.bark_enabled?.value === '1' ? 'default' : 'outline'}
                onClick={() => updateSetting('bark_enabled', '1')}
                className={settings.bark_enabled?.value === '1' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                ✓ 启用
              </Button>
              <Button
                variant={settings.bark_enabled?.value === '0' ? 'default' : 'outline'}
                onClick={() => updateSetting('bark_enabled', '0')}
                className={settings.bark_enabled?.value === '0' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                ✕ 禁用
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bark_key">Bark Key</Label>
            <Input
              id="bark_key"
              placeholder="请输入你的 Bark Key"
              value={settings.bark_key?.value || ''}
              onChange={(e) => updateSetting('bark_key', e.target.value)}
            />
            <p className="text-sm text-gray-500">
              在 Bark App 中可以找到你的 Key，格式如：aBcDeFgHiJkLmNoPqRsTuVwXyZ
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bark_server">Bark 服务器地址</Label>
            <Input
              id="bark_server"
              placeholder="https://api.day.app"
              value={settings.bark_server?.value || ''}
              onChange={(e) => updateSetting('bark_server', e.target.value)}
            />
            <p className="text-sm text-gray-500">
              默认使用官方服务器，如果你部署了自己的服务器可以在这里修改
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bark_sound">通知声音</Label>
            <select
              id="bark_sound"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={settings.bark_sound?.value || 'bell'}
              onChange={(e) => updateSetting('bark_sound', e.target.value)}
            >
              {getSoundOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bark_group">通知分组</Label>
            <Input
              id="bark_group"
              placeholder="校园小程序"
              value={settings.bark_group?.value || ''}
              onChange={(e) => updateSetting('bark_group', e.target.value)}
            />
            <p className="text-sm text-gray-500">
              设置通知分组名称，方便在 Bark 中管理
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={testing || settings.bark_enabled?.value !== '1'}>
              {testing ? '测试中...' : '发送测试通知'}
            </Button>
            {settings.bark_enabled?.value !== '1' && (
              <p className="text-sm text-gray-500 self-center">
                请先启用 Bark 通知并保存配置
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 通知触发条件 */}
      <Card>
        <CardHeader>
          <CardTitle>通知触发条件</CardTitle>
          <CardDescription>选择哪些事件会触发 Bark 通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">跳蚤市场新商品</Label>
              <div className="text-sm text-gray-500 mt-1">
                当用户发布新的跳蚤市场商品时通知
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant={settings.bark_notify_flea_market?.value === '1' ? 'default' : 'outline'}
                onClick={() => updateSetting('bark_notify_flea_market', '1')}
                size="sm"
                className={settings.bark_notify_flea_market?.value === '1' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                ✓ 启用
              </Button>
              <Button
                variant={settings.bark_notify_flea_market?.value === '0' ? 'default' : 'outline'}
                onClick={() => updateSetting('bark_notify_flea_market', '0')}
                size="sm"
                className={settings.bark_notify_flea_market?.value === '0' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                ✕ 禁用
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">失物招领新信息</Label>
              <div className="text-sm text-gray-500 mt-1">
                当用户发布新的失物招领信息时通知
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant={settings.bark_notify_lost_found?.value === '1' ? 'default' : 'outline'}
                onClick={() => updateSetting('bark_notify_lost_found', '1')}
                size="sm"
                className={settings.bark_notify_lost_found?.value === '1' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                ✓ 启用
              </Button>
              <Button
                variant={settings.bark_notify_lost_found?.value === '0' ? 'default' : 'outline'}
                onClick={() => updateSetting('bark_notify_lost_found', '0')}
                size="sm"
                className={settings.bark_notify_lost_found?.value === '0' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                ✕ 禁用
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={fetchSettings} disabled={saving}>
          重置
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存配置'}
        </Button>
      </div>
    </div>
  );
}
