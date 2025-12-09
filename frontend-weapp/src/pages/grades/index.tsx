import { Component } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService } from '../../services/api'
import './index.scss'

interface Grade {
  id: number
  学年学期?: string
  课程代码?: string
  课程序号?: string
  课程名称?: string
  课程类别?: string
  学分?: string
  补考成绩?: string
  总评成绩?: string
  最终?: string
  成绩?: string
  绩点?: string
  semester?: string
  [key: string]: any  // 允许其他动态字段
}

interface Statistics {
  total_courses: number
  average_score: number | null
  weighted_average: number | null
  numeric_grades_count: number
  total_credits: number
  grade_distribution: {
    [key: string]: number
  }
}

interface GradesState {
  loading: boolean
  loadingSemesters: boolean
  grades: Grade[]
  statistics: Statistics | null
  selectedSemester: string
  semesters: Array<{ id: string; name: string }>
  selectorChecked: string
  passRate: number
  excellentRate: number
  failRate: number
  showDetailModal: boolean
  selectedGrade: Grade | null
}

export default class GradesPage extends Component<{}, GradesState> {
  
  private hasShownLoginModal = false  // 标记是否已显示过登录弹窗

  state: GradesState = {
    loading: false,
    loadingSemesters: false,
    grades: [],
    statistics: null,
    selectedSemester: '',
    semesters: [],
    selectorChecked: '请选择学期',
    passRate: 0,
    excellentRate: 0,
    failRate: 0,
    showDetailModal: false,
    selectedGrade: null
  }

  componentDidMount() {
    // 先加载学期列表
    this.checkAndLoadData()
  }

  componentDidShow() {
    // 页面显示时检查登录状态，如果之前没有加载数据，则加载
    this.checkAndLoadData()
  }

  checkAndLoadData = () => {
    const userInfo = Taro.getStorageSync('userInfo')
    const userToken = Taro.getStorageSync('userToken')
    
    // 如果未登录，显示提示（但只显示一次）
    if (!userToken || !userInfo?.userId) {
      if (!this.hasShownLoginModal) {
        this.hasShownLoginModal = true
        Taro.showModal({
          title: '提示',
          content: '请先登录后查看成绩',
          confirmText: '去登录',
          cancelText: '返回',
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({
                url: '/pages/login/index'
              })
            } else {
              Taro.navigateBack()
            }
          }
        })
      }
      return
    }
    
    // 登录成功后重置标记
    this.hasShownLoginModal = false
    
    // 如果用户已登录但还没有加载学期数据，则加载
    if (this.state.semesters.length === 0 && !this.state.loadingSemesters) {
      this.loadSemesters()
    }
  }

  loadSemesters = async () => {
    const userInfo = Taro.getStorageSync('userInfo')
    const userToken = Taro.getStorageSync('userToken')

    // 防止重复加载
    if (this.state.loadingSemesters) {
      return
    }

    if (!userToken || !userInfo?.userId) {
      return
    }

    this.setState({ loadingSemesters: true })

    try {
      const response = await apiService.getSemesters(userInfo.userId) as any
      
      console.log('学期API原始响应:', response)

      if (response && response.data) {
        // 处理嵌套的 data 结构
        // response.data 可能本身就包含 data 字段
        let actualData = response.data
        
        // 如果 response.data 有嵌套的 data 字段，使用嵌套的
        if (actualData.data) {
          actualData = actualData.data
        }
        
        console.log('解析后的数据:', actualData)
        
        // 尝试多种可能的学期列表字段
        const semestersList = (
          actualData.all_semesters || 
          actualData.semesters || 
          []
        ).map((sem: any) => ({
          id: String(sem.id), // 确保 id 是字符串
          name: sem.display_name || sem.name || `学期${sem.id}`
        }))

        console.log('解析的学期列表:', semestersList)

        // 反转学期顺序，最新的学期在最前面
        semestersList.reverse()

        // 设置默认选中第一个学期（最新的）
        if (semestersList.length > 0) {
          this.setState({
            semesters: semestersList,
            selectedSemester: semestersList[0].id,
            selectorChecked: semestersList[0].name
          }, () => {
            console.log('学期加载成功，开始加载成绩')
            this.loadGrades()
          })
        } else {
          // 没有学期数据，显示错误信息
          const errorMsg = actualData.error || response.error || '未找到可用学期'
          console.error('学期列表为空:', errorMsg)
          
          this.setState({
            semesters: [],
            selectedSemester: '',
            selectorChecked: '暂无学期'
          })
          Taro.showModal({
            title: '获取学期失败',
            content: errorMsg,
            showCancel: false
          })
        }
      } else {
        throw new Error(response?.error || '学期数据格式错误')
      }
    } catch (error: any) {
      console.error('加载学期列表失败:', error)
      
      // 显示详细错误信息
      const errorMessage = error.message || error.errMsg || '加载学期失败'
      Taro.showModal({
        title: '加载失败',
        content: errorMessage,
        showCancel: false
      })
      
      // 设置空状态
      this.setState({
        semesters: [],
        selectedSemester: '',
        selectorChecked: '加载失败'
      })
    } finally {
      this.setState({ loadingSemesters: false })
    }
  }

  loadGrades = async () => {
    const userInfo = Taro.getStorageSync('userInfo')
    const userToken = Taro.getStorageSync('userToken')

    if (!userToken || !userInfo?.userId) {
      return
    }

    this.setState({ loading: true })

    try {
      const response = await apiService.getGrades(userInfo.userId, this.state.selectedSemester) as any
      
      console.log('成绩API原始响应:', response)

      if (response && response.data) {
        // 处理嵌套的 data 结构
        let actualData = response.data
        
        // 如果 response.data 有嵌套的 data 字段，使用嵌套的
        if (actualData.data) {
          actualData = actualData.data
        }
        
        console.log('解析后的成绩数据:', actualData)
        
        const gradesData = actualData.grades || []
        const stats = actualData.statistics || null

        // 计算及格率、优秀率、挂科率
        let passCount = 0
        let excellentCount = 0
        let failCount = 0
        let numericCount = 0

        gradesData.forEach((grade: Grade) => {
          const scoreStr = grade.最终 || grade.总评成绩 || grade.成绩 || ''
          const score = parseFloat(scoreStr)

          if (!isNaN(score)) {
            numericCount++
            if (score >= 90) excellentCount++
            if (score >= 60) {
              passCount++
            } else {
              failCount++
            }
          }
        })

        const passRate = numericCount > 0 ? Math.round((passCount / numericCount) * 100) : 0
        const excellentRate = numericCount > 0 ? Math.round((excellentCount / numericCount) * 100) : 0
        const failRate = numericCount > 0 ? Math.round((failCount / numericCount) * 100) : 0

        this.setState({
          grades: gradesData,
          statistics: stats,
          passRate,
          excellentRate,
          failRate
        })

        Taro.showToast({
          title: '加载成功',
          icon: 'success',
          duration: 1500
        })
      } else {
        throw new Error('数据格式错误')
      }
    } catch (error: any) {
      console.error('加载成绩失败:', error)
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  onSemesterChange = (e: any) => {
    const index = e.detail.value
    const semester = this.state.semesters[index]
    this.setState({
      selectedSemester: semester.id,
      selectorChecked: semester.name
    }, () => {
      this.loadGrades()
    })
  }

  getGradeScore = (grade: Grade): string => {
    return grade.最终 || grade.总评成绩 || grade.成绩 || '--'
  }

  getGradeClass = (grade: Grade): string => {
    const scoreStr = this.getGradeScore(grade)
    const score = parseFloat(scoreStr)

    if (isNaN(score)) return 'grade-normal'
    if (score >= 90) return 'grade-excellent'
    if (score >= 60) return 'grade-pass'
    return 'grade-fail'
  }

  onGradeClick = (grade: Grade) => {
    this.setState({
      showDetailModal: true,
      selectedGrade: grade
    })
  }

  closeDetailModal = () => {
    this.setState({
      showDetailModal: false,
      selectedGrade: null
    })
  }

  hasValue = (value: any): boolean => {
    return value !== undefined && value !== null && value !== ''
  }

  onBack = () => {
    Taro.navigateBack()
  }

  render() {
    const { loading, loadingSemesters, grades, statistics, semesters, selectorChecked, passRate, excellentRate, failRate, showDetailModal, selectedGrade } = this.state

    return (
      <View className="grades-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>

        {/* 顶部栏 */}
        <View className="header">
          <View className="header-back" onClick={this.onBack}>
            <Text className="back-icon">←</Text>
          </View>
          <View className="header-content">
            <Text className="header-title">成绩查询</Text>
          </View>
          <View className="header-placeholder"></View>
        </View>

        {/* 学期选择器 */}
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

        {/* 统计卡片 */}
        {statistics && (
          <View className="statistics-card">
            <View className="stat-item">
              <Text className="stat-label">总课程数</Text>
              <Text className="stat-value">{statistics.total_courses}</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">平均分</Text>
              <Text className="stat-value">
                {statistics.average_score !== null ? statistics.average_score.toFixed(1) : '--'}
              </Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">加权平均分</Text>
              <Text className="stat-value">
                {statistics.weighted_average !== null ? statistics.weighted_average.toFixed(1) : '--'}
              </Text>
            </View>
          </View>
        )}

        {/* 及格率、优秀率、挂科率 */}
        <View className="rate-cards">
          <View className="rate-card pass">
            <Text className="rate-label">及格率</Text>
            <Text className="rate-value">{passRate}%</Text>
          </View>
          <View className="rate-card excellent">
            <Text className="rate-label">优秀率</Text>
            <Text className="rate-value">{excellentRate}%</Text>
          </View>
          <View className="rate-card fail">
            <Text className="rate-label">挂科率</Text>
            <Text className="rate-value">{failRate}%</Text>
          </View>
        </View>

        {/* 成绩列表 */}
        <View className="grades-content">
          {loading ? (
            <View className="loading-container">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : grades.length > 0 ? (
            <View className="grades-list">
              {grades.map((grade, index) => (
                <View key={index} className="grade-item" onClick={() => this.onGradeClick(grade)}>
                  <View className="grade-header">
                    <Text className="course-name">{grade.课程名称 || '未知课程'}</Text>
                    <Text className={`grade-score ${this.getGradeClass(grade)}`}>
                      {this.getGradeScore(grade)}
                    </Text>
                  </View>
                  <View className="grade-details">
                    <View className="detail-item">
                      <Text className="detail-label">学分：</Text>
                      <Text className="detail-value">{grade.学分 || '--'}</Text>
                    </View>
                    {grade.绩点 && (
                      <View className="detail-item">
                        <Text className="detail-label">绩点：</Text>
                        <Text className="detail-value">{grade.绩点}</Text>
                      </View>
                    )}
                  </View>
                  <View className="grade-item-arrow">›</View>
                </View>
              ))}
            </View>
          ) : (
            <View className="empty-container">
              <Text className="empty-text">暂无成绩数据</Text>
            </View>
          )}
        </View>

        {/* 成绩详情弹窗 */}
        {showDetailModal && selectedGrade && (
          <View className="modal-overlay" onClick={this.closeDetailModal}>
            <View className="modal-content" onClick={(e) => e.stopPropagation()}>
              <View className="modal-header">
                <Text className="modal-title">成绩详情</Text>
                <View className="modal-close" onClick={this.closeDetailModal}>×</View>
              </View>
              <View className="modal-body">
                {/* 按教务系统表格顺序显示字段 */}
                {this.hasValue(selectedGrade.学年学期) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">学年学期</Text>
                    <Text className="detail-row-value">{selectedGrade.学年学期}</Text>
                  </View>
                )}
                
                {this.hasValue(selectedGrade.课程代码) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">课程代码</Text>
                    <Text className="detail-row-value">{selectedGrade.课程代码}</Text>
                  </View>
                )}
                
                {this.hasValue(selectedGrade.课程序号) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">课程序号</Text>
                    <Text className="detail-row-value">{selectedGrade.课程序号}</Text>
                  </View>
                )}
                
                <View className="detail-row">
                  <Text className="detail-row-label">课程名称</Text>
                  <Text className="detail-row-value">{selectedGrade.课程名称 || '--'}</Text>
                </View>
                
                {this.hasValue(selectedGrade.课程类别) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">课程类别</Text>
                    <Text className="detail-row-value">{selectedGrade.课程类别}</Text>
                  </View>
                )}
                
                <View className="detail-row">
                  <Text className="detail-row-label">学分</Text>
                  <Text className="detail-row-value">{selectedGrade.学分 || '--'}</Text>
                </View>
                
                {this.hasValue(selectedGrade.补考成绩) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">补考成绩</Text>
                    <Text className="detail-row-value">{selectedGrade.补考成绩}</Text>
                  </View>
                )}
                
                {this.hasValue(selectedGrade.总评成绩) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">总评成绩</Text>
                    <Text className="detail-row-value">{selectedGrade.总评成绩}</Text>
                  </View>
                )}
                
                {this.hasValue(selectedGrade.最终) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">最终</Text>
                    <Text className={`detail-row-value detail-score ${this.getGradeClass(selectedGrade)}`}>
                      {selectedGrade.最终}
                    </Text>
                  </View>
                )}
                
                {this.hasValue(selectedGrade.绩点) && (
                  <View className="detail-row">
                    <Text className="detail-row-label">绩点</Text>
                    <Text className="detail-row-value">{selectedGrade.绩点}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }
}

