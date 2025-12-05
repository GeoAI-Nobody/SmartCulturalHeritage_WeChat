/**
 * pages/map/map.js
 * 
 * 地图页面的主要逻辑文件
 * 
 * 该页面是小程序的主要页面之一，负责展示梅州市传统村落的地图分布。
 * 功能包括：
 * 1. 地图上显示所有传统村落的位置
 * 2. 支持按县镇村等条件进行筛选
 * 3. 点击村落标记点可查看详细信息
 * 4. 支持分享特定村落的地图位置
 */

// 获取全局应用实例，用于访问全局数据
const app = getApp()

// 导入县镇村结构化数据，用于实现筛选功能
import locationStructure from '../../data/locationStructure.js'

Page({
  /**
   * 用户点击右上角分享时触发
   * 实现小程序的分享功能，可以分享当前地图状态或选中的村落
   * @returns {Object} 分享配置信息
   */
  onShareAppMessage: function() {
    let title = '梅州传统村落地图';
    let path = '/pages/map/map';
    
    // 如果用户当前选中了某个村落点，则分享该具体村落的信息
    if (this.data.selectedPoint) {
      const point = this.data.selectedPoint;
      // 自定义分享标题，包含村落名称
      title = `梅州传统村落 - ${point.village}`;
      // 将县镇村信息编码到URL参数中，便于接收方直接定位到该村落
      path = `/pages/map/map?county=${encodeURIComponent(point.county)}&town=${encodeURIComponent(point.town)}&village=${encodeURIComponent(point.village)}`;
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
   * 定义了页面所需的各种状态和数据
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
    
    // 筛选菜单相关数据
    isMenuOpen: false,    // 筛选菜单是否处于打开状态
    isFiltered: false,    // 是否已应用筛选条件
    
    // 县镇村三级选择器相关数据
    countyList: [],       // 县区列表数组
    townList: [],         // 镇列表数组（根据选中的县动态变化）
    villageList: [],      // 村列表数组（根据选中的镇动态变化）
    selectedCounty: '',   // 当前选中的县区
    selectedTown: '',     // 当前选中的镇
    selectedVillage: '',  // 当前选中的村
  },

  /**
   * 调整地图视野，使指定点位于屏幕顶部指定位置
   * 这个函数用于在选中村落点时，调整地图视野使其处于合适的位置
   * @param {Object} point - 要展示的村落点对象，包含经纬度信息
   */
  adjustMapView(point) {
    // 验证点数据是否完整
    if (!point || !point.LATI || !point.LONG) return
    
    // 获取地图上下文对象，用于操作地图
    const mapCtx = wx.createMapContext('map')
    // 将经纬度转换为数字
    const lat = parseFloat(point.LATI)
    const lng = parseFloat(point.LONG)
    
    // 获取当前设备的系统信息，用于计算视野偏移
    const systemInfo = wx.getSystemInfoSync()
    const windowHeight = systemInfo.windowHeight  // 获取屏幕高度
    
    // 使用微信地图 API 的 includePoints 方法调整视野
    // 这个方法可以确保指定的点在地图视野内，并可以设置内边距
    mapCtx.includePoints({
      points: [{
        latitude: lat,
        longitude: lng
      }],
      padding: [
        windowHeight * this.data.mapViewOffset,       // 顶部padding，使点位于屏幕顶部的指定比例处
        0,                                          // 右侧padding
        windowHeight * (1 - this.data.mapViewOffset), // 底部padding，确保点不会在屏幕底部
        0                                           // 左侧padding
      ]
    })
    
    // 再次强制设置地图中心点，确保定位准确
    this.setData({
      latitude: lat,
      longitude: lng
    })
    
    // 输出调试信息
    console.log(`调整地图视野，点(${lat}, ${lng})位于顶部${this.data.mapViewOffset * 100}%位置`)
  },
  
  /**
   * 页面加载时触发的生命周期函数
   * 在页面初次加载时执行，负责初始化地图和处理分享链接参数
   * @param {Object} options - 页面参数对象，可能包含分享链接中的参数
   */
  onLoad(options) {
    // 初始化地图和数据
    this.initMap()
    
    // 处理分享链接中的参数
    // 如果链接中包含县镇村信息，则自动定位到对应村落
    if (options && options.county && options.town && options.village) {
      // 解码URL参数中的县镇村名称
      const county = decodeURIComponent(options.county);
      const town = decodeURIComponent(options.town);
      const village = decodeURIComponent(options.village);
      
      // 设置筛选条件到页面数据中
      this.setData({
        selectedCounty: county,    // 选中的县
        selectedTown: town,        // 选中的镇
        selectedVillage: village,  // 选中的村
        isFiltered: true           // 标记已经应用了筛选
      });
      
      // 从结构化数据中加载对应的镇列表和村列表
      const selectedCountyData = locationStructure.counties.find(c => c.name === county);
      if (selectedCountyData) {
        // 加载选中县的所有镇
        const townList = selectedCountyData.towns.map(t => t.name);
        this.setData({ townList });
        
        // 加载选中镇的所有村
        const selectedTownData = selectedCountyData.towns.find(t => t.name === town);
        if (selectedTownData) {
          const villageList = selectedTownData.villages.map(v => v.name);
          this.setData({ villageList });
        }
      }
      
      // 延时应用筛选，确保数据已经加载完成
      setTimeout(() => {
        this.applyFilter();  // 应用筛选条件，定位到指定村落
      }, 500);
    }
  },

  // 页面显示时触发（包括从其他页面返回时）
  onShow() {
    this.loadMapData(false) // 初始不显示所有点
  },

  // 初始化地图
  initMap() {
    this.loadMapData(false) // 初始不显示所有点
    this.updateMapBounds(true) // 只显示梅州市中心
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
  },

  // 加载地图数据，将空间点数据转换为地图标记点
  loadMapData(showAllPoints = true) {
    // 从全局数据中获取所有空间点
    const allPoints = app.globalData.mapPoints || []
    
    // 使用结构化数据获取县区列表
    const countyList = locationStructure.counties.map(county => county.name)
    
    // 更新页面数据
    this.setData({
      allPoints,
      countyList
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
    
    // 优先从筛选后的点中查找，如果没有筛选则从所有点中查找
    const pointsToSearch = this.data.filteredPoints.length > 0 ? 
                          this.data.filteredPoints : 
                          this.data.allPoints
    
    // 因为我们使用索引作为ID，所以直接通过索引获取点
    const originalPoint = pointsToSearch[markerId]
    
    if (originalPoint) {
      // 转换为英文属性名
      const selectedPoint = this.convertPoint(originalPoint)
      
      // 更新选中的地点信息，这会触发信息面板的显示
      this.setData({
        selectedPoint
      })
    }
  },

  // 点击地图空白区域时触发
  onMapTap() {
    // 清空选中的地点，隐藏信息面板
    this.setData({
      selectedPoint: null
    })
  },

  // 关闭信息面板
  closeInfoPanel() {
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
  
  // 切换菜单显示状态
  toggleMenu() {
    this.setData({
      isMenuOpen: !this.data.isMenuOpen
    })
  },
  
  // 选择县区
  selectCounty(e) {
    const county = e.currentTarget.dataset.county
    
    // 如果选择的是同一个县区，则不做处理
    if (county === this.data.selectedCounty) return
    
    // 从结构化数据中获取该县区下的所有镇
    const selectedCountyData = locationStructure.counties.find(c => c.name === county)
    const townList = selectedCountyData ? selectedCountyData.towns.map(town => town.name) : []
    
    // 更新选中的县区和镇列表，清空选中的镇和村
    this.setData({
      selectedCounty: county,
      townList,
      selectedTown: '',
      selectedVillage: '',
      villageList: []
    })
  },
  
  // 选择镇
  selectTown(e) {
    const town = e.currentTarget.dataset.town
    
    // 如果选择的是同一个镇，则不做处理
    if (town === this.data.selectedTown) return
    
    // 从结构化数据中获取该镇下的所有村
    const selectedCountyData = locationStructure.counties.find(c => c.name === this.data.selectedCounty)
    const selectedTownData = selectedCountyData ? 
                            selectedCountyData.towns.find(t => t.name === town) : 
                            null
    const villageList = selectedTownData ? 
                       selectedTownData.villages.map(village => village.name) : 
                       []
    
    // 更新选中的镇和村列表，清空选中的村
    this.setData({
      selectedTown: town,
      villageList,
      selectedVillage: ''
    })
  },
  
  // 选择村
  selectVillage(e) {
    const village = e.currentTarget.dataset.village
    
    // 更新选中的村
    this.setData({
      selectedVillage: village
    })
  },
  
  // 应用筛选
  applyFilter() {
    const { selectedCounty, selectedTown, selectedVillage, allPoints } = this.data
    
    // 根据选择的县区、镇、村筛选数据点
    let filteredPoints = allPoints
    
    if (selectedCounty) {
      filteredPoints = filteredPoints.filter(point => point.县 === selectedCounty)
      
      if (selectedTown) {
        filteredPoints = filteredPoints.filter(point => point.镇 === selectedTown)
        
        if (selectedVillage) {
          filteredPoints = filteredPoints.filter(point => point.村 === selectedVillage)
        }
      }
    }
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds()
    
    // 关闭菜单，显示筛选状态
    this.setData({
      isMenuOpen: false,
      isFiltered: selectedCounty !== ''
    })
  },
  
  // 重置筛选
  resetFilter() {
    // 清空选中的县区、镇、村
    this.setData({
      selectedCounty: '',
      selectedTown: '',
      selectedVillage: '',
      townList: [],
      villageList: [],
      isFiltered: false,
      selectedPoint: null  // 清除当前选中的点
    })
    
    // 如果已应用了筛选，则重置为显示所有点
    if (this.data.isFiltered) {
      this.updateMarkers(this.data.allPoints)
      this.updateMapBounds()
    }
  },
  

  

})
