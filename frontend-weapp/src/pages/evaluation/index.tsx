import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'

interface EvaluationItem {
  lesson_id: string
  teacher_name: string
  course_name: string
  course_code: string
  course_type: string
}

interface EvaluationState {
  loading: boolean
  submitting: boolean
  evaluations: EvaluationItem[]
  total: number
  error: string
}

export default class EvaluationPage extends Component<any, EvaluationState> {
  state: EvaluationState = {
    loading: true,
    submitting: false,
    evaluations: [],
    total: 0,
    error: ''
  }

  componentDidMount() {
    this.loadPendingEvaluations()
  }

  loadPendingEvaluations = async () => {
    this.setState({ loading: true, error: '' })
    try {
      const res: any = await apiService.getPendingEvaluations()
      if (res?.success && res?.data) {
        this.setState({
          evaluations: res.data.evaluations || [],
          total: res.data.total || 0
        })
      } else {
        this.setState({ error: res?.error || '获取评教列表失败' })
      }
    } catch (e: any) {
      this.setState({ error: e?.message || '网络错误' })
    } finally {
      this.setState({ loading: false })
    }
  }

  handleAutoEvaluate = async () => {
    const { evaluations, submitting } = this.state
    if (submitting) return
    if (evaluations.length === 0) {
      Taro.showToast({ title: '没有待评教课程', icon: 'none' })
      return
    }

    const confirm = await Taro.showModal({
      title: '一键评教',
      content: `将对 ${evaluations.length} 门课程进行评教，默认选择"完全符合"(100分)，确定继续？`,
      confirmText: '确定',
      cancelText: '取消'
    })

    if (!confirm.confirm) return

    this.setState({ submitting: true })
    Taro.showLoading({ title: '评教中...' })

    try {
      const res: any = await apiService.autoEvaluateAll(0, '无')
      Taro.hideLoading()

      if (res?.success && res?.data) {
        const { succeeded, failed, total } = res.data
        Taro.showModal({
          title: '评教完成',
          content: `共 ${total} 门课程，成功 ${succeeded} 门，失败 ${failed} 门`,
          showCancel: false
        })
        // 刷新列表
        this.loadPendingEvaluations()
      } else {
        Taro.showToast({ title: res?.error || '评教失败', icon: 'none' })
      }
    } catch (e: any) {
      Taro.hideLoading()
      Taro.showToast({ title: e?.message || '网络错误', icon: 'none' })
    } finally {
      this.setState({ submitting: false })
    }
  }

  render() {
    const { loading, submitting, evaluations, total, error } = this.state
    const allCompleted = !loading && !error && total === 0

    return (
      <View className="evaluation-page">
        {/* 自定义导航栏 */}
        <View className="nav-bar">
          <View className="nav-back" onClick={() => Taro.navigateBack()}>
            <Text className="back-icon">‹</Text>
          </View>
          <Text className="nav-title">量化评教</Text>
          <View className="nav-placeholder" />
        </View>

        {/* 状态卡片 */}
        <View className="status-card">
          <View className="status-icon-wrap">
            {allCompleted ? (
              <Text className="status-icon completed">✓</Text>
            ) : (
              <Text className="status-icon pending">{total}</Text>
            )}
          </View>
          <Text className="status-text">
            {loading ? '加载中...' : error ? '加载失败' : allCompleted ? '已完成所有评教' : `${total} 门课程待评教`}
          </Text>
          {error && (
            <Text className="retry-btn" onClick={this.loadPendingEvaluations}>点击重试</Text>
          )}
        </View>

        {/* 课程列表 */}
        <ScrollView className="course-list" scrollY>
          {evaluations.map((item, idx) => (
            <View key={item.lesson_id} className="course-item">
              <View className="course-index">{idx + 1}</View>
              <View className="course-info">
                <Text className="course-name">{item.course_name}</Text>
                <Text className="course-meta">{item.course_code} · {item.teacher_name}</Text>
              </View>
              <View className="course-status pending">待评</View>
            </View>
          ))}
          {!loading && !error && evaluations.length === 0 && (
            <View className="empty-tip">
              <Text className="empty-text">🎉 所有课程已评教完成</Text>
            </View>
          )}
        </ScrollView>

        {/* 底部按钮 */}
        {!allCompleted && !loading && !error && (
          <View className="bottom-action">
            <View
              className={`action-btn ${submitting ? 'disabled' : ''}`}
              onClick={this.handleAutoEvaluate}
            >
              <Text className="btn-text">{submitting ? '评教中...' : '一键评教'}</Text>
            </View>
            <Text className="action-tip">默认选择"完全符合"(100分)</Text>
          </View>
        )}
      </View>
    )
  }
}
