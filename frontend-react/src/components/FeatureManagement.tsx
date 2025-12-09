import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import ApiService from '../services/api'

interface Feature {
  id: number
  feature_key: string
  is_enabled: boolean
  feature_name: string
  description: string
  offline_message: string
  updated_at: string
}

export function FeatureManagement() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editMessage, setEditMessage] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [switchingId, setSwitchingId] = useState<number | null>(null)

  useEffect(() => {
    loadFeatures()
  }, [])

  // 自动隐藏消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 加载功能列表
  const loadFeatures = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getFeatureList()
      if (data.success) {
        setFeatures(data.data || [])
      } else {
        setMessage({ type: 'error', text: data.message || '加载功能列表失败' })
      }
    } catch (error) {
      console.error('加载功能列表失败:', error)
      setMessage({ type: 'error', text: '加载功能列表失败' })
    } finally {
      setLoading(false)
    }
  }

  // 切换功能开关
  const handleToggle = async (feature: Feature, isEnabled: boolean) => {
    // 显示确认对话框
    const action = isEnabled ? '开启' : '关闭'
    if (!window.confirm(`确定要${action}「${feature.feature_name}」功能吗？\n\n${isEnabled ? '开启后用户可以正常访问此功能。' : '关闭后用户将无法访问此功能，会显示提示信息。'}`)) {
      return
    }

    try {
      setSwitchingId(feature.id)
      const data = await ApiService.toggleFeature(feature.feature_key, isEnabled)
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `「${feature.feature_name}」已${isEnabled ? '开启' : '关闭'}` 
        })
        loadFeatures()
      } else {
        setMessage({ type: 'error', text: data.message || '操作失败' })
      }
    } catch (error) {
      console.error('切换功能状态失败:', error)
      setMessage({ type: 'error', text: '切换功能状态失败' })
    } finally {
      setSwitchingId(null)
    }
  }

  // 开始编辑提示信息
  const startEdit = (feature: Feature) => {
    setEditingId(feature.id)
    setEditMessage(feature.offline_message)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null)
    setEditMessage('')
  }

  // 保存提示信息
  const saveMessage = async (id: number) => {
    if (!editMessage.trim()) {
      setMessage({ type: 'error', text: '提示信息不能为空' })
      return
    }

    try {
      const data = await ApiService.updateFeature(id, { offline_message: editMessage })
      if (data.success) {
        setMessage({ type: 'success', text: '提示信息已更新' })
        setEditingId(null)
        setEditMessage('')
        loadFeatures()
      } else {
        setMessage({ type: 'error', text: data.message || '更新失败' })
      }
    } catch (error) {
      console.error('更新提示信息失败:', error)
      setMessage({ type: 'error', text: '更新提示信息失败' })
    }
  }

  // 获取功能图标
  const getFeatureIcon = (key: string) => {
    switch (key) {
      case 'flea_market':
        return '🛒'
      case 'lost_found':
        return '🔍'
      default:
        return '⚙️'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">功能开关管理</h2>
          <p className="text-muted-foreground mt-2">
            控制小程序中各功能模块的开放状态，关闭后用户将无法访问对应功能
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadFeatures}
          disabled={loading}
        >
          {loading ? '刷新中...' : '刷新列表'}
        </Button>
      </div>

      {message && (
        <Alert 
          variant={message.type === 'error' ? 'destructive' : 'default'}
          className="animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <AlertDescription className="flex items-center">
            <span className="mr-2">{message.type === 'success' ? '✓' : '✗'}</span>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      ) : features.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">暂无功能配置</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {features.map(feature => (
            <Card 
              key={feature.id}
              className="transition-all duration-200 hover:shadow-lg"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-4xl mt-1">
                      {getFeatureIcon(feature.feature_key)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl">{feature.feature_name}</CardTitle>
                        <Badge 
                          variant={feature.is_enabled ? 'default' : 'secondary'}
                          className="transition-all duration-200"
                        >
                          {feature.is_enabled ? '✓ 已开启' : '✗ 已关闭'}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <Label 
                      htmlFor={`switch-${feature.id}`}
                      className={`text-sm font-medium transition-colors ${
                        feature.is_enabled ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {feature.is_enabled ? '开启' : '关闭'}
                    </Label>
                    <Switch
                      id={`switch-${feature.id}`}
                      checked={feature.is_enabled}
                      disabled={switchingId === feature.id}
                      onCheckedChange={(checked: boolean) => handleToggle(feature, checked)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">功能标识</Label>
                    <code className="block mt-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      {feature.feature_key}
                    </code>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">最后更新</Label>
                    <p className="mt-1 px-3 py-2 text-sm">
                      {new Date(feature.updated_at).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    关闭时提示信息
                  </Label>
                  {editingId === feature.id ? (
                    <div className="space-y-3 mt-2 animate-in fade-in duration-200">
                      <Textarea
                        value={editMessage}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditMessage(e.target.value)}
                        rows={3}
                        placeholder="请输入功能关闭时向用户显示的提示信息"
                        maxLength={100}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {editMessage.length} / 100 字符
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => saveMessage(feature.id)}
                            disabled={!editMessage.trim()}
                          >
                            保存
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            取消
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between mt-2 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm flex-1 pr-4">
                        {feature.offline_message || '（未设置提示信息）'}
                      </p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => startEdit(feature)}
                        className="shrink-0"
                      >
                        ✏️ 编辑
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default FeatureManagement
