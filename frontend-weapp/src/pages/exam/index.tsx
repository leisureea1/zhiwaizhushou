import { Component } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'

interface ExamItem {
  id: number
  course_name?: string
  exam_time?: string
  exam_date?: string
  start_time?: string
  end_time?: string
  location?: string
  seat?: string
  exam_type?: string
  status?: string
  [key: string]: any
}

interface Semester {
  id: string
  name: string
  current?: boolean
}

interface ExamState {
  loading: boolean
  loadingSemesters: boolean
  exams: ExamItem[]
  error: string
  semesters: Semester[]
  selectedSemester: string
  selectorChecked: string
}

export default class ExamPage extends Component<any, ExamState> {
  state: ExamState = {
    loading: false,
    loadingSemesters: false,
    exams: [],
    error: '',
    semesters: [],
    selectedSemester: '',
    selectorChecked: '请选择学期'
  }

  componentDidMount() {
    this.checkAndLoadData()
  }

  componentDidShow() {
    this.checkAndLoadData()
  }

  checkAndLoadData = () => {
    const userInfo = Taro.getStorageSync('userInfo')
    const userToken = Taro.getStorageSync('userToken')
    
    if (!userToken || !userInfo?.userId) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后查看考试安排',
        confirmText: '去登录',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          } else {
            Taro.navigateBack()
          }
        }
      })
      return
    }
    
    if (this.state.semesters.length === 0 && !this.state.loadingSemesters) {
      this.loadSemesters()
    }
  }

  loadSemesters = async () => {
    const userInfo = Taro.getStorageSync('userInfo')
    const userToken = Taro.getStorageSync('userToken')

    if (this.state.loadingSemesters || !userToken || !userInfo?.userId) {
      return
    }

    this.setState({ loadingSemesters: true })

    try {
      const response = await apiService.getSemesters(userInfo.userId) as any
      
      if (response && response.data) {
        let actualData = response.data
        if (actualData.data) {
          actualData = actualData.data
        }
        
        const semestersList = (
          actualData.all_semesters || 
          actualData.semesters || 
          []
        ).map((sem: any) => ({
          id: String(sem.id),
          name: sem.display_name || sem.name || `学期${sem.id}`,
          current: sem.current
        }))

        if (semestersList.length > 0) {
          // 找到当前学期或使用第一个
          const currentSem = semestersList.find((s: Semester) => s.current) || semestersList[0]
          
          this.setState({
            semesters: semestersList,
            selectedSemester: currentSem.id,
            selectorChecked: currentSem.name
          }, () => {
            this.loadExams()
          })
        } else {
          this.setState({
            semesters: [],
            selectedSemester: '',
            selectorChecked: '暂无学期',
            error: '未找到可用学期'
          })
        }
      }
    } catch (error: any) {
      console.error('加载学期列表失败:', error)
      this.setState({
        semesters: [],
        selectorChecked: '加载失败',
        error: error.message || '加载学期失败'
      })
    } finally {
      this.setState({ loadingSemesters: false })
    }
  }

  loadExams = async () => {
    this.setState({ loading: true, error: '' })
    
    try {
      const { selectedSemester } = this.state
      const res: any = await apiService.getExams(selectedSemester || undefined)
      
      if (res?.success) {
        const data = res.data || res
        const exams = data?.exams || []
        this.setState({ 
          exams, 
          loading: false,
          error: exams.length === 0 ? '暂无考试安排' : ''
        })
      } else {
        this.setState({ 
          loading: false, 
          error: res?.error || '获取考试信息失败' 
        })
      }
    } catch (e: any) {
      console.error('获取考试信息失败', e)
      this.setState({ 
        loading: false, 
        error: e?.message || '网络错误，请稍后重试' 
      })
    }
  }

  onSemesterChange = (e: any) => {
    const index = e.detail.value
    const semester = this.state.semesters[index]
    this.setState({
      selectedSemester: semester.id,
      selectorChecked: semester.name
    }, () => {
      this.loadExams()
    })
  }

  getExamTime = (exam: ExamItem): string => {
    if (exam.exam_time) return exam.exam_time
    if (exam.exam_date && exam.start_time && exam.end_time) {
      return `${exam.exam_date} ${exam.start_time}-${exam.end_time}`
    }
    if (exam.exam_date) return exam.exam_date
    if (exam['考试日期'] && exam['考试日期'] !== '时间未安排') {
      const time = exam['考试安排'] && exam['考试安排'] !== '时间未安排' ? ` ${exam['考试安排']}` : ''
      return `${exam['考试日期']}${time}`
    }
    return '待定'
  }

  getExamLocation = (exam: ExamItem): string => {
    return exam.location || exam['考试地点'] || '待定'
  }

  onBack = () => {
    Taro.navigateBack()
  }

  render() {
    const { loading, loadingSemesters, exams, error, semesters, selectorChecked } = this.state

    return (
      <View className="exam-page">
        <View className="status-bar-placeholder"></View>

        <View className="header">
          <View className="header-back" onClick={this.onBack}>
            <Text className="back-icon">←</Text>
          </View>
          <View className="header-content">
            <Text className="header-title">考试安排</Text>
          </View>
          <View className="header-placeholder"></View>
        </View>

        {loadingSemesters ? (
          <View className="semester-selector">
            <Text className="selector-label">加载学期中...</Text>
          </View>
        ) : (
          <View className="semester-selector">
            <Text className="selector-label">选择学期：</Text>
            <Picker
              mode="selector"
              range={semesters}
              rangeKey="name"
              onChange={this.onSemesterChange}
              disabled={semesters.length === 0}
            >
              <View className="selector-value">
                <Text>{selectorChecked}</Text>
                <Text className="selector-arrow">▼</Text>
              </View>
            </Picker>
          </View>
        )}

        <View className="exam-content">
          {loading && (
            <View className="loading-container">
              <Text className="loading-text">加载中...</Text>
            </View>
          )}

          {!loading && error && exams.length === 0 && (
            <View className="empty-container">
              <Text className="empty-text">{error}</Text>
              <View className="retry-btn" onClick={this.loadExams}>
                <Text>重新加载</Text>
              </View>
            </View>
          )}

          {!loading && exams.length > 0 && (
            <View className="exam-list">
              {exams.map((exam, index) => (
                <View key={exam.id || index} className="exam-item">
                  <View className="exam-header">
                    <Text className="course-name">
                      {exam.course_name || exam['课程名称'] || '未知课程'}
                    </Text>
                    {(exam.exam_type || exam['考试类别']) && (
                      <Text className="exam-type">
                        {exam.exam_type || exam['考试类别']}
                      </Text>
                    )}
                  </View>
                  
                  <View className="exam-details">
                    <View className="detail-item">
                      <Text className="detail-label">时间：</Text>
                      <Text className="detail-value">{this.getExamTime(exam)}</Text>
                    </View>
                    
                    <View className="detail-item">
                      <Text className="detail-label">地点：</Text>
                      <Text className="detail-value">{this.getExamLocation(exam)}</Text>
                    </View>
                    
                    {(exam.seat || exam['座位号']) && (
                      <View className="detail-item">
                        <Text className="detail-label">座位：</Text>
                        <Text className="detail-value seat">{exam.seat || exam['座位号']}</Text>
                      </View>
                    )}

                    {(exam.status || exam['考试情况']) && (
                      <View className="detail-item">
                        <Text className="detail-label">状态：</Text>
                        <Text className={`detail-value status ${(exam.status || exam['考试情况']) === '正常' ? 'normal' : ''}`}>
                          {exam.status || exam['考试情况']}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    )
  }
}
