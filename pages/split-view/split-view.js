/**
 * pages/split-view/split-view.js
 * 
 * 分栏视图页面的主要逻辑文件
 * 
 * 该页面将地图和村落列表同时显示，采用上下分屏的布局方式。
 * 上部分是地图视图，显示村落的地理分布。
 * 下部分是村落列表，支持搜索和点击定位。
 * 用户可以在列表中选择村落，地图会自动定位到选中的村落。
 */

// 获取全局应用实例，用于访问全局数据
const app = getApp()

// 导入县镇村结构化数据，用于实现筛选功能
import locationStructure from '../../data/locationStructure.js'

Page({
  /**
   * 用户点击右上角分享时触发
   * 实现分栏视图页面的分享功能，可以分享当前状态或选中的村落
   * @returns {Object} 分享配置信息
   */
  onShareAppMessage: function() {
    let title = '梅州传统村落地图';
    let path = '/pages/split-view/split-view';
    
    // 如果用户当前选中了某个村落点，则分享该具体村落的信息
    if (this.data.selectedPoint) {
      const point = this.data.selectedPoint;
      // 自定义分享标题，包含村落名称
      title = `梅州传统村落 - ${point.village}`;
      // 将县镇村信息编码到URL参数中，便于接收方直接定位到该村落
      path = `/pages/split-view/split-view?county=${encodeURIComponent(point.county)}&town=${encodeURIComponent(point.town)}&village=${encodeURIComponent(point.village)}`;
    }
    
    // 返回分享配置
    return {
      title: title,      // 分享标题
      path: path,        // 分享路径
      imageUrl: '/images/share-cover.png' // 自定义分享图片
    };
  },
  
  /**
   * 页面的初始数据对象
   * 定义了分栏视图页面所需的各种状态和数据
   */
  data: {
    // 地图相关数据
    longitude: 116.1225,  // 地图中心经度 - 梅州市中心位置
    latitude: 24.2886,    // 地图中心纬度 - 梅州市中心位置
    scale: 10,            // 地图缩放级别，10表示市级视图
    markers: [],          // 地图标记点数组，用于显示村落位置
    selectedPoint: null,  // 当前选中的村落点信息，用于显示详情面板
    mapViewOffset: 0.1,   // 地图视图偏移量，0.1表示点位于屏幕顶部10%处
    
    // 数据相关
    allPoints: [],        // 所有村落点的完整数据
    filteredPoints: [],   // 筛选后的村落点数据
    
    // 列表相关数据
    searchKeyword: '',    // 搜索框中的关键词
    filteredListPoints: [], // 搜索过滤后的列表数据，用于列表显示
    convertedPoints: [],  // 转换格式后的所有点数据，用于列表显示和搜索
  },

  // 页面加载时触发
  onLoad(options) {
    // 初始化地图和数据
    this.initMap()
    
    // 确保点位数据已加载
    wx.nextTick(() => {
      // 确保点位数据已加载
      const allPoints = app.globalData.mapPoints || []
      const convertedPoints = allPoints.map((point, index) => this.convertPoint(point))
      
      this.setData({
        convertedPoints,
        filteredListPoints: convertedPoints
      })
    })
  },

  // 页面显示时触发（包括从其他页面返回时）
  onShow() {
    this.loadMapData(true) // 初始显示所有点
  },

  // 调整地图视野，使指定点位于屏幕顶部指定位置
  adjustMapView(point) {
    if (!point || !point.LATI || !point.LONG) return
    
    const mapCtx = wx.createMapContext('map')
    const lat = parseFloat(point.LATI)
    const lng = parseFloat(point.LONG)
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    const windowHeight = systemInfo.windowHeight
    
    // 使用includePoints方法调整视野
    mapCtx.includePoints({
      points: [{
        latitude: lat,
        longitude: lng
      }],
      padding: [
        windowHeight * this.data.mapViewOffset, // 顶部padding
        0,                                     // 右侧padding
        windowHeight * (1 - this.data.mapViewOffset), // 底部padding
        0                                      // 左侧padding
      ]
    })
    
    // 再次强制设置中心点
    this.setData({
      latitude: lat,
      longitude: lng
    })
    
    console.log(`调整地图视野，点(${lat}, ${lng})位于顶部${this.data.mapViewOffset * 100}%位置`)
  },
  
  // 初始化地图
  initMap() {
    this.loadMapData(true) // 初始显示所有点
    // 设置初始边界为所有320个点的空间范围
    this.updateMapBounds()
  },

  // 更新地图边界
  updateMapBounds(isInitial = false) {
    if (isInitial) {
      // 初始状态，只显示梅州市中心
      this.setData({
        latitude: 24.2886,
        longitude: 116.1225,
        scale: 10
      })
      return
    }
    
    // 如果有筛选的点，则根据筛选的点计算边界
    const pointsToUse = this.data.filteredPoints.length > 0 ? 
                      this.data.filteredPoints : 
                      this.data.allPoints
    
    if (pointsToUse.length === 0) {
      // 如果没有点，显示梅州市中心
      this.setData({
        latitude: 24.2886,
        longitude: 116.1225,
        scale: 10
      })
      return
    }
    
    // 计算边界
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
    
    pointsToUse.forEach(point => {
      if (point.LATI && point.LONG) {
        const lat = parseFloat(point.LATI)
        const lng = parseFloat(point.LONG)
        if (!isNaN(lat) && !isNaN(lng)) {
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
        }
      }
    })
    
    // 计算中心点
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // 计算合适的缩放级别
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)
    
    let scale = 12
    if (maxDiff > 0.5) scale = 10
    if (maxDiff > 1) scale = 9
    if (maxDiff > 2) scale = 8
    
    // 更新地图视图
    this.setData({
      latitude: centerLat,
      longitude: centerLng,
      scale: scale
    })
    
    // 使用地图上下文确保所有点都在视野内
    setTimeout(() => {
      const mapCtx = wx.createMapContext('map')
      if (mapCtx && pointsToUse.length > 0) {
        const mapPoints = pointsToUse.map(point => ({
          latitude: parseFloat(point.LATI),
          longitude: parseFloat(point.LONG)
        }))
        
        mapCtx.includePoints({
          points: mapPoints,
          padding: [80, 80, 80, 80] // 为分栏视图留出适当的空间
        })
      }
    }, 300)
  },

  // 加载地图数据，将空间点数据转换为地图标记点
  loadMapData(showAllPoints = true) {
    // 从全局数据中获取所有空间点
    const allPoints = app.globalData.mapPoints || []
    
    // 转换所有点数据为列表显示格式
    const convertedPoints = allPoints.map((point, index) => this.convertPoint(point));
    
    // 更新页面数据
    this.setData({
      allPoints,
      convertedPoints,
      filteredListPoints: convertedPoints // 初始化列表数据
    })
    
    // 如果需要显示所有点，则更新markers
    if (showAllPoints) {
      this.updateMarkers(allPoints)
    } else {
      // 初始不显示任何点
      this.setData({
        markers: []
      })
    }
  },
  
  // 将中文属性名转换为英文属性名
  convertPoint(point) {
    if (!point) return null;
    
    // 创建一个新对象，使用英文属性名
    return {
      id: point.id,
      county: point.县,
      town: point.镇,
      village: point.村,
      LATI: point.LATI,
      LONG: point.LONG,
      buildingForm: point.主要建筑形式,
      foundingYear: point.建村年代,
      rating: point.评级,
      // 添加其他需要的属性...
      // 保留原始数据
      originalData: point
    };
  },

  // 更新地图标记点
  updateMarkers(points) {
    // 将空间点数据转换为微信地图组件需要的markers格式
    const markers = points.map((point, index) => {
      // 转换点数据
      const convertedPoint = this.convertPoint(point);
      
      return {
        id: index,                       // 使用索引作为唯一标识
        latitude: parseFloat(point.LATI), // 确保纬度是数值类型
        longitude: parseFloat(point.LONG), // 确保经度是数值类型
        title: convertedPoint.village,    // 使用村名作为标题
        iconPath: this.getMarkerIcon(convertedPoint), // 根据建筑类型选择图标
        width: 40,                       // 图标宽度
        height: 40,                      // 图标高度
        callout: {                       // 标记点点击后显示的标签
          content: `${convertedPoint.county} ${convertedPoint.town} ${convertedPoint.village}`, // 显示完整位置信息
          display: 'BYCLICK'            // 点击时显示
        }
      };
    })
    
    // 更新页面数据
    this.setData({
      markers,
      filteredPoints: points
    })
  },

  // 根据建筑类型获取对应的图标路径
  getMarkerIcon(point) {
    const buildingForm = point.buildingForm || ''
    
    // 根据建筑类型选择图标
    if (buildingForm.includes('围龙屋') || buildingForm.includes('围屋')) {
      return '/images/围龙屋.png'
    } else if (buildingForm.includes('横堂屋')) {
      return '/images/横堂屋.png'
    } else {
      return '/images/其它类型.png'
    }
  },

  // 点击地图标记点时触发
  onMarkerTap(e) {
    const markerId = e.markerId  // 获取被点击的标记点ID
    
    // 从所有点中查找
    const originalPoint = this.data.allPoints[markerId]
    
    if (originalPoint) {
      // 转换为英文属性名
      const selectedPoint = this.convertPoint(originalPoint)
      
      // 更新选中的地点信息，这会触发信息面板的显示
      this.setData({
        selectedPoint
      })
    }
  },

  // 关闭信息面板
  closeInfoPanel() {
    // 清空选中的地点，隐藏信息面板
    this.setData({
      selectedPoint: null
    })
  },

  // 点击地图空白区域时触发
  onMapTap() {
    // 清空选中的地点，隐藏信息面板
    this.setData({
      selectedPoint: null
    })
  },



  // 查看地点详情
  viewDetail(e) {
    // 从按钮的data属性中获取地点数据
    const point = e.currentTarget.dataset.point
    
    // 跳转到详情页面，并传递县镇村信息作为参数
    wx.navigateTo({
      url: `/pages/point-detail/point-detail?county=${encodeURIComponent(point.county)}&town=${encodeURIComponent(point.town)}&village=${encodeURIComponent(point.village)}`
    })
  },

  // 将地点类型转换为中文显示文本
  getTypeText(type) {
    const typeMap = {
      'landmark': '地标建筑',  // landmark -> 地标建筑
      'museum': '博物馆',      // museum -> 博物馆
      'park': '公园'           // park -> 公园
    }
    // 如果没有找到对应类型，返回"其他"
    return typeMap[type] || '其他'
  },

  // 格式化访问量显示，超过1万显示为"x.x万"
  formatVisitCount(count) {
    if (count >= 10000) {
      // 将访问量除以10000，保留一位小数，然后加上"万"字
      return (count / 10000).toFixed(1) + '万'
    }
    // 小于1万直接返回数字字符串
    return count.toString()
  },
  

  
  // 搜索点位
  searchPoints(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    
    this.setData({
      searchKeyword: keyword
    })
    
    if (!keyword) {
      // 如果关键词为空，显示所有点
      this.setData({
        filteredListPoints: this.data.convertedPoints
      })
      return
    }
    
    // 根据关键词筛选点位
    const filteredListPoints = this.data.convertedPoints.filter(point => {
      return (
        point.village && point.village.toLowerCase().includes(keyword) ||
        point.county && point.county.toLowerCase().includes(keyword) ||
        point.town && point.town.toLowerCase().includes(keyword) ||
        point.buildingForm && point.buildingForm.toLowerCase().includes(keyword)
      )
    })
    
    this.setData({
      filteredListPoints
    })
  },
  
  // 从列表中选择点位
  selectListPoint(e) {
    const index = e.currentTarget.dataset.index
    const selectedPoint = this.data.filteredListPoints[index]
    
    if (selectedPoint) {
      // 确保地图上有标记点
      if (this.data.markers.length === 0) {
        // 如果地图上没有点，先加载所有点
        this.updateMarkers(this.data.allPoints)
      }
      
      // 查找对应的原始点在markers中的索引
      const markerId = this.data.markers.findIndex(marker => 
        marker.latitude === parseFloat(selectedPoint.LATI) && 
        marker.longitude === parseFloat(selectedPoint.LONG)
      )
      
      // 直接设置中心点和缩放级别
      this.setData({
        latitude: parseFloat(selectedPoint.LATI),
        longitude: parseFloat(selectedPoint.LONG),
        scale: 15, // 放大到适合查看单个点的级别
        selectedMarkerId: markerId >= 0 ? markerId : null // 高亮选中的点
      })
      
      // 使用自定义方法调整视野，确保点位于正确位置
      setTimeout(() => {
        this.adjustMapView(selectedPoint)
      }, 100)
      
      console.log(`定位点到页面顶部下方${this.data.mapViewOffset * 100}%位置`)
    }
  }
})

