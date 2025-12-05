/**
 * app.js - 微信小程序的应用入口文件
 * 
 * 这个文件是整个小程序的入口点，负责：
 * 1. 初始化全局数据和配置
 * 2. 提供全局可访问的数据和方法
 * 3. 管理小程序的生命周期
 * 
 * 该小程序主要展示梅州市传统村落的地理分布和详细信息，
 * 包含320个传统村落的数据，支持地图浏览、属性查询等功能。
 */

// 导入统一的梅州传统村落数据（包含320个村落的详细信息）
import allDatas from './data/villageData.js'

App({
  /**
   * 小程序启动时触发的生命周期函数
   * 在这里可以进行全局初始化操作
   */
  onLaunch() {
    // 小程序启动时的初始化逻辑
    // 可以在这里进行一些全局初始化操作，比如：
    // - 检查用户登录状态
    // - 初始化全局数据
    // - 检查网络状态
    // - 加载必要的配置等
    console.log('小程序启动成功，已加载传统村落数据')
  },

  /**
   * 全局数据对象
   * 可以在所有页面中通过 getApp().globalData 访问
   */
  globalData: {
    /**
     * 梅州传统村落数据 - 包含320个传统村落的详细信息
     * 数据结构：[
     *   {
     *     县: '县名',
     *     镇: '镇名',
     *     村: '村名',
     *     LATI: '纬度',
     *     LONG: '经度',
     *     主要建筑形式: '建筑形式',
     *     建村年代: '年代',
     *     评级: '评级',
     *     ... 其他属性
     *   },
     *   ...
     * ]
     */
    mapPoints: allDatas,
    
    /**
     * 计算地图边界函数
     * 根据所有村落点的经纬度计算合适的地图边界和缩放级别
     * @returns {Object} 包含边界信息的对象
     */
    getMapBounds() {
      const allPoints = this.mapPoints
      // 初始化边界值（最大范围）
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
      
      // 确保有点数据
      if (allPoints && allPoints.length > 0) {
        // 遍历所有点，找出最大最小经纬度
        allPoints.forEach(point => {
          // 确保点有有效的经纬度
          if (point.LATI && point.LONG) {
            const lat = parseFloat(point.LATI)
            const lng = parseFloat(point.LONG)
            if (!isNaN(lat) && !isNaN(lng)) {
              // 更新边界值
              minLat = Math.min(minLat, lat)
              maxLat = Math.max(maxLat, lat)
              minLng = Math.min(minLng, lng)
              maxLng = Math.max(maxLng, lng)
            }
          }
        })
      }
      
      // 计算地图中心点坐标
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      
      // 计算合适的缩放级别
      // 对于梅州地区的320个点，需要动态计算合适的缩放级别
      const latDiff = maxLat - minLat  // 纬度跨度
      const lngDiff = maxLng - minLng  // 经度跨度
      const maxDiff = Math.max(latDiff, lngDiff)  // 取较大的跨度
      
      // 根据点的分布范围计算缩放级别
      // 缩放级别越小，显示的区域越大
      let scale = 12  // 默认缩放级别（较近）
      if (maxDiff > 0.5) scale = 9   // 中等范围
      if (maxDiff > 1) scale = 8     // 较大范围
      if (maxDiff > 2) scale = 7     // 最大范围
      
      // 返回计算结果
      return {
        minLat,     // 最小纬度
        maxLat,     // 最大纬度
        minLng,     // 最小经度
        maxLng,     // 最大经度
        centerLat,  // 中心点纬度
        centerLng,  // 中心点经度
        scale       // 建议的缩放级别
      }
    }
  }
})
