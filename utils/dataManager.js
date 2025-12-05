/**
 * utils/dataManager.js
 * 
 * 数据管理器模块 - 支持本地数据和云端数据的混合使用
 * 
 * 该模块提供了数据管理的功能，包括：
 * 1. 本地数据的加载和管理
 * 2. 云端数据的加载和管理
 * 3. 本地和云端数据的合并
 * 4. 网络状态的检测和处理
 * 
 * 该模块实现了离线和在线模式的无缝切换，当网络可用时使用云端数据，
 * 当网络不可用时自动切换到本地数据。
 */

/**
 * 数据管理器类
 * 管理小程序的数据加载、合并和访问
 */
class DataManager {
  /**
   * 构造函数
   * 初始化数据管理器的属性
   */
  constructor() {
    this.localData = null   // 存储本地数据
    this.cloudData = null   // 存储云端数据
    this.isOnline = true    // 网络状态标志，默认为在线
  }

  /**
   * 初始化数据管理器
   * 加载本地数据和云端数据，并处理可能出现的错误
   * @returns {Promise<void>} 初始化完成的Promise
   */
  async init() {
    try {
      // 先加载本地数据，确保即使网络不可用也有数据显示
      this.loadLocalData()
      
      // 尝试加载云端数据，这是一个异步操作
      await this.loadCloudData()
    } catch (error) {
      // 如果出现错误，记录错误信息并切换到离线模式
      console.error('数据初始化失败:', error)
      // 如果云端数据加载失败，只使用本地数据
      this.isOnline = false
    }
  }

  /**
   * 加载本地数据
   * 从全局数据中获取预先准备好的村落数据（从Excel转换的JSON）
   */
  loadLocalData() {
    // 这里从全局应用实例中获取数据
    // 全局数据在app.js中通过导入villageData.js初始化
    const app = getApp()
    this.localData = app.globalData.mapPoints || []
  }

  /**
   * 加载云端数据
   * 从远程服务器获取最新的村落数据
   * 注意：当前为模拟实现，实际应用中需要替换为真实API地址
   * @returns {Promise<void>} 加载完成的Promise
   */
  async loadCloudData() {
    try {
      // 调用云端API获取村落数据
      // 注意：这里的URL是示例，需要替换为实际的API地址
      const response = await wx.request({
        url: 'https://your-api-domain.com/api/points',
        method: 'GET',
        timeout: 5000  // 设置5秒超时，防止长时间等待
      })
      
      // 检查响应状态码
      if (response.statusCode === 200) {
        this.cloudData = response.data  // 存储云端数据
      }
    } catch (error) {
      // 如果出现错误，记录日志并切换到离线模式
      console.warn('云端数据加载失败，切换到本地数据模式:', error)
      this.isOnline = false  // 标记为离线状态
    }
  }

  /**
   * 获取所有村落点数据
   * 根据当前网络状态，返回合并后的数据或仅本地数据
   * @returns {Array} 村落点数据数组
   */
  getAllPoints() {
    // 如果在线且云端数据已加载，返回合并后的数据
    if (this.isOnline && this.cloudData) {
      // 合并本地数据和云端数据，确保数据完整性
      return this.mergeData(this.localData, this.cloudData)
    } else {
      // 如果离线或云端数据未加载，只返回本地数据
      return this.localData
    }
  }

  /**
   * 合并本地数据和云端数据
   * 使用云端数据更新或补充本地数据，确保数据的完整性和最新性
   * @param {Array} localData - 本地数据数组
   * @param {Array} cloudData - 云端数据数组
   * @returns {Array} 合并后的数据数组
   */
  mergeData(localData, cloudData) {
    // 复制本地数据，避免直接修改原始数据
    const merged = [...localData]
    
    // 遍历云端数据，用云端数据更新本地数据
    cloudData.forEach(cloudPoint => {
      // 根据id查找本地数据中是否存在对应的点
      const localIndex = merged.findIndex(localPoint => localPoint.id === cloudPoint.id)
      
      if (localIndex !== -1) {
        // 如果存在，更新现有数据，使用云端数据覆盖本地数据
        // 使用对象展开运算符合并属性，保留本地数据的完整性
        merged[localIndex] = { ...merged[localIndex], ...cloudPoint }
      } else {
        // 如果不存在，添加新数据
        merged.push(cloudPoint)
      }
    })
    
    return merged
  }

  // 获取单个地点详情
  async getPointDetail(pointId) {
    // 首先从本地数据查找
    const localPoint = this.localData.find(point => point.id === pointId)
    
    if (this.isOnline) {
      try {
        // 尝试从云端获取详细信息
        const response = await wx.request({
          url: `https://your-api-domain.com/api/points/${pointId}`,
          method: 'GET',
          timeout: 3000
        })
        
        if (response.statusCode === 200) {
          // 合并本地和云端数据
          return { ...localPoint, ...response.data }
        }
      } catch (error) {
        console.warn('获取云端详情失败:', error)
      }
    }
    
    return localPoint
  }

  // 检查网络状态
  checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          this.isOnline = res.networkType !== 'none'
          resolve(this.isOnline)
        },
        fail: () => {
          this.isOnline = false
          resolve(false)
        }
      })
    })
  }

  // 刷新数据
  async refreshData() {
    await this.checkNetworkStatus()
    if (this.isOnline) {
      await this.loadCloudData()
    }
  }
}

// 创建全局数据管理器实例
const dataManager = new DataManager()

export default dataManager


