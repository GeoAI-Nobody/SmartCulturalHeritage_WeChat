// pages/attribute-query/attribute-query.js
const app = getApp()
import locationStructure from '../../data/locationStructure.js'

Page({
  // 用户点击右上角分享
  onShareAppMessage: function() {
    let title = '梅州传统村落属性查询';
    let path = '/pages/attribute-query/attribute-query';
    
    // 如果有选中的点，可以分享这个具体的点
    if (this.data.selectedPoint) {
      const point = this.data.selectedPoint;
      title = `梅州传统村落 - ${point.village}`;
      path = `/pages/attribute-query/attribute-query?queryType=${this.data.queryType}&county=${encodeURIComponent(point.county)}&town=${encodeURIComponent(point.town)}&village=${encodeURIComponent(point.village)}`;
    }
    
    return {
      title: title,
      path: path,
      imageUrl: '/images/share-cover.png' // 自定义分享图片（可选）
    };
  },
  
  // 页面的初始数据
  data: {
    // 查询类型
    queryType: '', // 默认不选择任何查询类型
    queryTypeList: [
      { value: 'surname', label: '姓氏分布' },
      { value: 'founding-year', label: '建村年代' },
      { value: 'terrain', label: '地形地貌' },
      { value: 'river-width', label: '河流宽度' },
      { value: 'road', label: '道路' },
      { value: 'flow-form', label: '流经形式' },
      { value: 'formation-reason', label: '形成原因' },
      { value: 'village-scale', label: '村落规模' },
      { value: 'surname-structure', label: '姓氏结构' },
      { value: 'street-form', label: '街巷形式' },
      { value: 'layout-form', label: '建筑布局形式' },
      { value: 'building-form', label: '主要建筑形式' }
    ],
    currentQueryTypeLabel: '', // 当前选中的查询类型标签
    
    // 地图数据
    longitude: 116.1225,  // 经度
    latitude: 24.2886,    // 纬度
    scale: 10,            // 地图缩放级别，10表示市级视图
    markers: [],          // 地图标记点数组
    
    // 数据源
    allPoints: [],        // 所有空间点的数据
    filteredPoints: [],   // 筛选后的空间点数据
    convertedPoints: [],  // 转换后的点数据
    
    // 选中的点
    selectedPoint: null,  // 当前选中的地点信息
    
    // 姓氏查询相关
    surnameList: [],      // 姓氏列表
    selectedSurname: '',  // 选中的姓氏
    
    // 年代查询相关
    eraList: [],          // 建村年代列表（从实际数据中提取）
    selectedEra: '',      // 选中的年代
    selectedEraLabel: '', // 选中年代的显示文本
    
    // 县镇查询相关
    countyList: [],       // 县区列表
    townList: [],         // 镇列表
    selectedCounty: '',   // 选中的县区
    selectedTown: '',     // 选中的镇
    
    // 地形地貌查询相关
    terrainList: [],        // 地形地貌列表
    selectedTerrain: '',    // 选中的地形地貌
    
    // 河流宽度查询相关
    riverWidthList: [],     // 河流宽度列表
    selectedRiverWidth: '', // 选中的河流宽度
    
    // 道路查询相关
    roadList: [],          // 道路列表
    selectedRoad: '',      // 选中的道路
    
    // 流经形式查询相关
    flowFormList: [],      // 流经形式列表
    selectedFlowForm: '',  // 选中的流经形式
    
    // 形成原因查询相关
    formationReasonList: [], // 形成原因列表
    selectedFormationReason: '', // 选中的形成原因
    
    // 村落规模查询相关
    villageScaleList: [],   // 村落规模列表
    selectedVillageScale: '', // 选中的村落规模
    
    // 姓氏结构查询相关
    surnameStructureList: [], // 姓氏结构列表
    selectedSurnameStructure: '', // 选中的姓氏结构
    
    // 街巷形式查询相关
    streetFormList: [],     // 街巷形式列表
    selectedStreetForm: '', // 选中的街巷形式
    
    // 建筑布局形式查询相关
    layoutFormList: [],     // 建筑布局形式列表
    selectedLayoutForm: '', // 选中的建筑布局形式
    
    // 主要建筑形式查询相关
    buildingFormList: [],   // 主要建筑形式列表
    selectedBuildingForm: '', // 选中的主要建筑形式
    
    // 结果列表相关
    showResultList: false,  // 是否显示结果列表
    resultListHeight: 220,  // 结果列表高度，调整为能完整显示第一行查询结果
    startY: 0,             // 拖动开始的Y坐标
    resultListMinHeight: 180, // 结果列表最小高度，确保能显示一行完整结果
    resultListMaxHeight: 500  // 结果列表最大高度
  },

  // 页面加载时触发
  onLoad(options) {
    // 加载所有数据
    this.loadAllData()
    
    // 如果有传入的查询类型，则设置
    if (options && options.queryType) {
      this.setQueryType(null, options.queryType)
    }
    
    // 如果有传入的县镇村参数，则设置
    if (options && options.county && options.town && options.village) {
      const county = decodeURIComponent(options.county)
      const town = decodeURIComponent(options.town)
      const village = decodeURIComponent(options.village)
      
      // 查找对应的点
      const allPoints = app.globalData.mapPoints || []
      const point = allPoints.find(p => 
        p.县 === county && p.镇 === town && p.村 === village
      )
      
      if (point) {
        const convertedPoint = this.convertPoint(point)
        this.setData({
          selectedPoint: convertedPoint
        })
      }
    }
  },

  // 页面显示时触发
  onShow() {
    // 如果数据未加载，则加载
    if (this.data.allPoints.length === 0) {
      this.loadAllData()
    }
  },

  // 加载所有数据
  loadAllData() {
    // 从全局数据中获取所有空间点
    const allPoints = app.globalData.mapPoints || []
    
    // 转换所有点数据为列表显示格式
    const convertedPoints = allPoints.map((point, index) => this.convertPoint(point))
    
    // 提取姓氏列表
    const surnameSet = new Set()
    convertedPoints.forEach(point => {
      if (point.originalData && point.originalData.主要姓氏) {
        const surnames = point.originalData.主要姓氏.split('、')
        surnames.forEach(surname => {
          if (surname.trim()) {
            surnameSet.add(surname.trim())
          }
        })
      }
    })
    const surnameList = Array.from(surnameSet).sort()
    
    // 提取建村年代列表
    const eraSet = new Set()
    convertedPoints.forEach(point => {
      if (point.foundingYear) {
        eraSet.add(point.foundingYear)
      }
    })
    const eraList = Array.from(eraSet).sort()
    
    // 提取各种属性列表
    const terrainSet = new Set()
    const riverWidthSet = new Set()
    const roadSet = new Set()
    const flowFormSet = new Set()
    const formationReasonSet = new Set()
    const villageScaleSet = new Set()
    const surnameStructureSet = new Set()
    const streetFormSet = new Set()
    const layoutFormSet = new Set()
    const buildingFormSet = new Set()
    
    convertedPoints.forEach(point => {
      if (point.terrain) terrainSet.add(point.terrain)
      if (point.riverWidth) riverWidthSet.add(point.riverWidth)
      if (point.roadForm) roadSet.add(point.roadForm)
      if (point.flowForm) flowFormSet.add(point.flowForm)
      if (point.formationReason) formationReasonSet.add(point.formationReason)
      if (point.villageScale) villageScaleSet.add(point.villageScale)
      if (point.surnameStructure) surnameStructureSet.add(point.surnameStructure)
      if (point.streetForm) streetFormSet.add(point.streetForm)
      if (point.layoutForm) layoutFormSet.add(point.layoutForm)
      if (point.buildingForm) buildingFormSet.add(point.buildingForm)
    })
    
    // 使用结构化数据获取县区列表
    const countyList = locationStructure.counties.map(county => county.name)
    
    // 更新页面数据
    this.setData({
      allPoints,
      convertedPoints,
      surnameList,
      eraList,
      countyList,
      terrainList: Array.from(terrainSet).sort(),
      riverWidthList: Array.from(riverWidthSet).sort(),
      roadList: Array.from(roadSet).sort(),
      flowFormList: Array.from(flowFormSet).sort(),
      formationReasonList: Array.from(formationReasonSet).sort(),
      villageScaleList: Array.from(villageScaleSet).sort(),
      surnameStructureList: Array.from(surnameStructureSet).sort(),
      streetFormList: Array.from(streetFormSet).sort(),
      layoutFormList: Array.from(layoutFormSet).sort(),
      buildingFormList: Array.from(buildingFormSet).sort()
    })
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
      terrain: point.地形地貌,
      riverWidth: point.河道宽度,
      roadForm: point.道路,
      flowForm: point.流经形式,
      formationReason: point.形成原因,
      villageScale: point.村落规模,
      surnameStructure: point.姓氏结构,
      streetForm: point.街巷形式,
      layoutForm: point.建筑布局形式,
      // 保留原始数据
      originalData: point
    };
  },

  // 查询类型选择器变化
  onQueryTypeChange(e) {
    const index = parseInt(e.detail.value)
    const selectedType = this.data.queryTypeList[index]
    
    this.setData({
      queryType: selectedType.value,
      currentQueryTypeLabel: selectedType.label
    })
  },

  // 设置查询类型
  setQueryType(e, typeValue) {
    const type = typeValue || e.currentTarget.dataset.type
    
    // 找到对应的标签
    const selectedType = this.data.queryTypeList.find(item => item.value === type)
    
    this.setData({
      queryType: type,
      currentQueryTypeLabel: selectedType ? selectedType.label : '',
      // 重置查询条件
      selectedSurname: '',
      selectedEra: '',
      selectedEraLabel: '',
      selectedCounty: '',
      selectedTown: '',
      townList: [],
      selectedTerrain: '',
      selectedRiverWidth: '',
      selectedRoad: '',
      selectedFlowForm: '',
      selectedFormationReason: '',
      selectedVillageScale: '',
      selectedSurnameStructure: '',
      selectedStreetForm: '',
      selectedLayoutForm: '',
      selectedBuildingForm: '',
      filteredPoints: [],
      markers: [],
      selectedPoint: null
    })
    
    // 如果切换到县镇查询，重置县镇列表
    if (type === 'county-town') {
      // 使用结构化数据获取县区列表
      const countyList = locationStructure.counties.map(county => county.name)
      this.setData({ countyList })
    }
  },

  // 姓氏选择器变化
  onSurnameChange(e) {
    const index = parseInt(e.detail.value)
    const surname = this.data.surnameList[index]
    
    // 如果选择的是已选中的姓氏，则取消选择
    if (surname === this.data.selectedSurname) {
      this.setData({
        selectedSurname: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据姓氏筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => {
      if (point.originalData && point.originalData.主要姓氏) {
        return point.originalData.主要姓氏.includes(surname)
      }
      return false
    })
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('result-map')
    
    this.setData({
      selectedSurname: surname,
      filteredPoints
    })
  },

  // 年代选择器变化
  onEraChange(e) {
    const index = parseInt(e.detail.value)
    const era = this.data.eraList[index]
    
    // 如果选择的是已选中的年代，则取消选择
    if (era === this.data.selectedEra) {
      this.setData({
        selectedEra: '',
        selectedEraLabel: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据年代筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => {
      return point.foundingYear === era
    })
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('era-result-map')
    
    this.setData({
      selectedEra: era,
      selectedEraLabel: era,
      filteredPoints
    })
  },



  // 地形地貌选择器变化
  onTerrainChange(e) {
    const index = parseInt(e.detail.value)
    const terrain = this.data.terrainList[index]
    
    // 如果选择的是已选中的地形地貌，则取消选择
    if (terrain === this.data.selectedTerrain) {
      this.setData({
        selectedTerrain: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据地形地貌筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.terrain === terrain
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('terrain-result-map')
    
    this.setData({
      selectedTerrain: terrain,
      filteredPoints
    })
  },

  // 河流宽度选择器变化
  onRiverWidthChange(e) {
    const index = parseInt(e.detail.value)
    const riverWidth = this.data.riverWidthList[index]
    
    // 如果选择的是已选中的河流宽度，则取消选择
    if (riverWidth === this.data.selectedRiverWidth) {
      this.setData({
        selectedRiverWidth: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据河流宽度筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.riverWidth === riverWidth
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('river-width-result-map')
    
    this.setData({
      selectedRiverWidth: riverWidth,
      filteredPoints
    })
  },

  // 道路选择器变化
  onRoadChange(e) {
    const index = parseInt(e.detail.value)
    const road = this.data.roadList[index]
    
    // 如果选择的是已选中的道路，则取消选择
    if (road === this.data.selectedRoad) {
      this.setData({
        selectedRoad: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据道路筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.roadForm === road
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('road-result-map')
    
    this.setData({
      selectedRoad: road,
      filteredPoints
    })
  },

  // 流经形式选择器变化
  onFlowFormChange(e) {
    const index = parseInt(e.detail.value)
    const flowForm = this.data.flowFormList[index]
    
    // 如果选择的是已选中的流经形式，则取消选择
    if (flowForm === this.data.selectedFlowForm) {
      this.setData({
        selectedFlowForm: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据流经形式筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.flowForm === flowForm
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('flow-form-result-map')
    
    this.setData({
      selectedFlowForm: flowForm,
      filteredPoints
    })
  },

  // 形成原因选择器变化
  onFormationReasonChange(e) {
    const index = parseInt(e.detail.value)
    const formationReason = this.data.formationReasonList[index]
    
    // 如果选择的是已选中的形成原因，则取消选择
    if (formationReason === this.data.selectedFormationReason) {
      this.setData({
        selectedFormationReason: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据形成原因筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.formationReason === formationReason
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('formation-reason-result-map')
    
    this.setData({
      selectedFormationReason: formationReason,
      filteredPoints
    })
  },

  // 村落规模选择器变化
  onVillageScaleChange(e) {
    const index = parseInt(e.detail.value)
    const villageScale = this.data.villageScaleList[index]
    
    // 如果选择的是已选中的村落规模，则取消选择
    if (villageScale === this.data.selectedVillageScale) {
      this.setData({
        selectedVillageScale: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据村落规模筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.villageScale === villageScale
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('village-scale-result-map')
    
    this.setData({
      selectedVillageScale: villageScale,
      filteredPoints
    })
  },

  // 姓氏结构选择器变化
  onSurnameStructureChange(e) {
    const index = parseInt(e.detail.value)
    const surnameStructure = this.data.surnameStructureList[index]
    
    // 如果选择的是已选中的姓氏结构，则取消选择
    if (surnameStructure === this.data.selectedSurnameStructure) {
      this.setData({
        selectedSurnameStructure: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据姓氏结构筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.surnameStructure === surnameStructure
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('surname-structure-result-map')
    
    this.setData({
      selectedSurnameStructure: surnameStructure,
      filteredPoints
    })
  },

  // 街巷形式选择器变化
  onStreetFormChange(e) {
    const index = parseInt(e.detail.value)
    const streetForm = this.data.streetFormList[index]
    
    // 如果选择的是已选中的街巷形式，则取消选择
    if (streetForm === this.data.selectedStreetForm) {
      this.setData({
        selectedStreetForm: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据街巷形式筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.streetForm === streetForm
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('street-form-result-map')
    
    this.setData({
      selectedStreetForm: streetForm,
      filteredPoints
    })
  },

  // 建筑布局形式选择器变化
  onLayoutFormChange(e) {
    const index = parseInt(e.detail.value)
    const layoutForm = this.data.layoutFormList[index]
    
    // 如果选择的是已选中的建筑布局形式，则取消选择
    if (layoutForm === this.data.selectedLayoutForm) {
      this.setData({
        selectedLayoutForm: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据建筑布局形式筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.layoutForm === layoutForm
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('layout-form-result-map')
    
    this.setData({
      selectedLayoutForm: layoutForm,
      filteredPoints
    })
  },

  // 主要建筑形式选择器变化
  onBuildingFormChange(e) {
    const index = parseInt(e.detail.value)
    const buildingForm = this.data.buildingFormList[index]
    
    // 如果选择的是已选中的主要建筑形式，则取消选择
    if (buildingForm === this.data.selectedBuildingForm) {
      this.setData({
        selectedBuildingForm: '',
        filteredPoints: [],
        markers: []
      })
      return
    }
    
    // 根据主要建筑形式筛选村落
    const filteredPoints = this.data.convertedPoints.filter(point => 
      point.buildingForm === buildingForm
    )
    
    // 更新地图标记点
    this.updateMarkers(filteredPoints)
    
    // 更新地图边界
    this.updateMapBounds('building-form-result-map')
    
    this.setData({
      selectedBuildingForm: buildingForm,
      filteredPoints
    })
  },

  // 更新地图标记点
  updateMarkers(points) {
    // 将空间点数据转换为微信地图组件需要的markers格式
    const markers = points.map((point, index) => {
      return {
        id: index,                       // 使用索引作为唯一标识
        latitude: parseFloat(point.LATI), // 确保纬度是数值类型
        longitude: parseFloat(point.LONG), // 确保经度是数值类型
        title: point.village,            // 使用村名作为标题
        iconPath: this.getMarkerIcon(point), // 根据建筑类型选择图标
        width: 40,                       // 图标宽度
        height: 40,                      // 图标高度
        callout: {                       // 标记点点击后显示的标签
          content: `${point.county} ${point.town} ${point.village}`, // 显示完整位置信息
          display: 'BYCLICK',            // 点击时显示
          fontSize: 14,                  // 字体大小
          padding: 8,                    // 内边距
          borderRadius: 4,               // 边框圆角
          bgColor: '#ffffff',            // 背景颜色
          textAlign: 'center'            // 文本对齐方式
        }
      };
    })
    
    // 更新页面数据
    this.setData({
      markers
    })
    
    // 同时更新对应查询类型的markers数据
    const queryType = this.data.queryType
    let markersKey = `${queryType}Markers`
    // 处理连字符
    if (queryType === 'founding-year') {
      markersKey = 'foundingYearMarkers'
    } else if (queryType === 'river-width') {
      markersKey = 'riverWidthMarkers'
    } else if (queryType === 'flow-form') {
      markersKey = 'flowFormMarkers'
    } else if (queryType === 'formation-reason') {
      markersKey = 'formationReasonMarkers'
    } else if (queryType === 'village-scale') {
      markersKey = 'villageScaleMarkers'
    } else if (queryType === 'surname-structure') {
      markersKey = 'surnameStructureMarkers'
    } else if (queryType === 'street-form') {
      markersKey = 'streetFormMarkers'
    } else if (queryType === 'layout-form') {
      markersKey = 'layoutFormMarkers'
    } else if (queryType === 'building-form') {
      markersKey = 'buildingFormMarkers'
    }
    this.setData({
      [markersKey]: markers,
      showResultList: points.length > 0 // 如果有筛选结果则显示结果列表
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

  // 更新地图边界
  updateMapBounds(mapId = 'result-map') {
    const points = this.data.filteredPoints
    
    if (points.length === 0) {
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
    
    points.forEach(point => {
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
    
    // 使用地图上下文确保所有点都在视野内，增加更大的padding以适应实际可见区域
    setTimeout(() => {
      const mapCtx = wx.createMapContext(mapId)
      if (mapCtx && points.length > 0) {
        const mapPoints = points.map(point => ({
          latitude: parseFloat(point.LATI),
          longitude: parseFloat(point.LONG)
        }))
        
        mapCtx.includePoints({
          points: mapPoints,
          padding: [100, 100, 100, 100] // 增加更大的padding，确保所有点都在可见区域内
        })
      }
    }, 300) // 增加延迟时间，确保地图组件完全渲染
  },

  /**
   * 点击地图标记点时触发
   * 这个函数处理用户点击地图上的标记点的事件
   * 当用户点击地图上的标记点时，会显示该点的详情信息面板
   * 注意：这个函数只在点击地图上的标记点时才会触发，不会在点击列表项时触发
   * @param {Object} e - 事件对象，包含被点击的标记点ID
   */
  onMarkerTap(e) {
    const markerId = e.markerId  // 获取被点击的标记点ID
    
    // 获取对应的点
    const point = this.data.filteredPoints[markerId]
    
    if (point) {
      // 更新选中的地点信息，这会触发信息面板的显示
      this.setData({
        selectedPoint: point
      })
      
      // 调整地图视野，确保标记点在合适的位置，并留出足够空间显示详情面板
      if (point.LATI && point.LONG) {
        setTimeout(() => {
          // 根据查询类型选择对应的地图ID
          let mapId = 'result-map'
          switch (this.data.queryType) {
            case 'surname':
              mapId = 'result-map'
              break
            case 'founding-year':
              mapId = 'era-result-map'
              break
            case 'terrain':
              mapId = 'terrain-result-map'
              break
            case 'river-width':
              mapId = 'river-width-result-map'
              break
            case 'road':
              mapId = 'road-result-map'
              break
            case 'flow-form':
              mapId = 'flow-form-result-map'
              break
            case 'formation-reason':
              mapId = 'formation-reason-result-map'
              break
            case 'village-scale':
              mapId = 'village-scale-result-map'
              break
            case 'surname-structure':
              mapId = 'surname-structure-result-map'
              break
            case 'street-form':
              mapId = 'street-form-result-map'
              break
            case 'layout-form':
              mapId = 'layout-form-result-map'
              break
            case 'building-form':
              mapId = 'building-form-result-map'
              break
          }
          
          const mapCtx = wx.createMapContext(mapId)
          if (mapCtx) {
            // 获取系统信息，用于计算适当的视野偏移
            wx.getSystemInfo({
              success: (res) => {
                const windowHeight = res.windowHeight
                const detailPanelHeight = windowHeight * 0.3 // 假设详情面板高度约为屏幕高度的30%
                
                // 计算地图中心点应该偏移的距离，使标记点位于地图上部
                const offsetRatio = 0.3 // 标记点位于地图上部30%的位置
                
                // 调整地图视野，使标记点位于地图上部，并留出足够空间显示详情面板
                mapCtx.includePoints({
                  points: [{
                    latitude: parseFloat(point.LATI),
                    longitude: parseFloat(point.LONG)
                  }],
                  padding: [
                    windowHeight * offsetRatio, // 顶部留出空间
                    0, // 右侧不需要特别留空间
                    windowHeight * 0.5, // 底部留出大量空间，确保详情面板完整显示
                    0  // 左侧不需要特别留空间
                  ]
                })
              }
            })
          }
        }, 100)
      }
      
      // 调试信息，查看是否正确设置了selectedPoint
      console.log('地图点击点后设置的selectedPoint:', point)
    }
  },
  
  /**
   * 点击地图空白区域时触发
   * 这个函数处理用户点击地图上的空白区域的事件
   * 当用户点击地图空白区域时，会隐藏当前显示的详情信息面板
   */
  onMapTap() {
    // 清空选中的地点，隐藏信息面板
    this.setData({
      selectedPoint: null
    })
    
    // 调试信息，确认清空了selectedPoint
    console.log('地图空白区域点击后清空了selectedPoint')
  },

  // 查看村落详情
  viewVillageDetail(e) {
    const point = e.currentTarget.dataset.point
    
    // 定位到地图上的对应位置并显示详情面板
    if (point && point.LATI && point.LONG) {
      this.setData({
        latitude: parseFloat(point.LATI),
        longitude: parseFloat(point.LONG),
        scale: 15, // 放大到适合查看单个点的级别
        selectedPoint: point // 显示详情面板
      })
      
      // 根据当前查询类型选择对应的地图ID
      let mapId = 'result-map'
      switch (this.data.queryType) {
        case 'surname':
          mapId = 'result-map'
          break
        case 'founding-year':
          mapId = 'era-result-map'
          break
        case 'terrain':
          mapId = 'terrain-result-map'
          break
        case 'river-width':
          mapId = 'river-width-result-map'
          break
        case 'road':
          mapId = 'road-result-map'
          break
        case 'flow-form':
          mapId = 'flow-form-result-map'
          break
        case 'formation-reason':
          mapId = 'formation-reason-result-map'
          break
        case 'village-scale':
          mapId = 'village-scale-result-map'
          break
        case 'surname-structure':
          mapId = 'surname-structure-result-map'
          break
        case 'street-form':
          mapId = 'street-form-result-map'
          break
        case 'layout-form':
          mapId = 'layout-form-result-map'
          break
        case 'building-form':
          mapId = 'building-form-result-map'
          break
      }
      
      // 使用地图上下文调整视野
      setTimeout(() => {
        const mapCtx = wx.createMapContext(mapId)
        if (mapCtx) {
          mapCtx.includePoints({
            points: [{
              latitude: parseFloat(point.LATI),
              longitude: parseFloat(point.LONG)
            }],
            padding: [100, 0, 100, 0] // 顶部和底部留出空间
          })
        }
      }, 100)
    }
  },
  
  /**
   * 从拖动结果列表中选择村落并定位到地图
   * 这个函数处理用户点击拖动结果列表中的村落项的事件
   * 当用户点击列表项时，会将地图定位到该点并显示详情信息面板
   * 注意：这个函数的关键是要正确设置 selectedPoint 来显示详情面板
   * @param {Object} e - 事件对象，包含被点击的列表项数据
   */
  selectResultItem(e) {
    const point = e.currentTarget.dataset.point
    
    // 定位到地图上的对应位置并显示详情面板
    if (point && point.LATI && point.LONG) {
      // 查找对应的标记点
      const markers = this.data.markers || []
      let markerId = -1
      
      // 在标记点中查找匹配的点
      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i]
        if (marker.latitude === parseFloat(point.LATI) && 
            marker.longitude === parseFloat(point.LONG)) {
          markerId = marker.id
          break
        }
      }
      
      // 更新地图位置和选中的点
      this.setData({
        latitude: parseFloat(point.LATI),
        longitude: parseFloat(point.LONG),
        scale: 15, // 放大到适合查看单个点的级别
        selectedPoint: point // 显示详情面板
      })
      
      // 调试信息，查看是否正确设置了selectedPoint
      console.log('点击结果列表项后设置的selectedPoint:', point)
      
      // 使用地图上下文调整视野
      setTimeout(() => {
        // 根据查询类型选择对应的地图ID
        // 这里需要注意，不同的查询类型使用不同的地图ID
        let mapId = 'result-map'
        switch (this.data.queryType) {
          case 'surname':
            mapId = 'result-map'
            break
          case 'founding-year':
            mapId = 'era-result-map'
            break
          case 'terrain':
            mapId = 'terrain-result-map'
            break
          case 'river-width':
            mapId = 'river-width-result-map'
            break
          case 'road':
            mapId = 'road-result-map'
            break
          case 'flow-form':
            mapId = 'flow-form-result-map'
            break
          case 'formation-reason':
            mapId = 'formation-reason-result-map'
            break
          case 'village-scale':
            mapId = 'village-scale-result-map'
            break
          case 'surname-structure':
            mapId = 'surname-structure-result-map'
            break
          case 'street-form':
            mapId = 'street-form-result-map'
            break
          case 'layout-form':
            mapId = 'layout-form-result-map'
            break
          case 'building-form':
            mapId = 'building-form-result-map'
            break
        }
        
        console.log('使用的地图ID:', mapId)
        
        const mapCtx = wx.createMapContext(mapId)
        if (mapCtx) {
          // 获取系统信息，用于计算适当的视野偏移
          wx.getSystemInfo({
            success: (res) => {
              const windowHeight = res.windowHeight
              
              // 计算地图中心点应该偏移的距离，使标记点位于地图上部
              const offsetRatio = 0.3 // 标记点位于地图上部30%的位置
              
              // 调整地图视野，使标记点位于地图上部，并留出足够空间显示详情面板
              mapCtx.includePoints({
                points: [{
                  latitude: parseFloat(point.LATI),
                  longitude: parseFloat(point.LONG)
                }],
                padding: [
                  windowHeight * offsetRatio, // 顶部留出空间
                  0, // 右侧不需要特别留空间
                  windowHeight * 0.5, // 底部留出大量空间，确保详情面板完整显示
                  0  // 左侧不需要特别留空间
                ]
              })
            }
          })
        }
      }, 100)
      
      // 不再关闭结果列表，保留其显示状态
      // 让用户可以自行决定是否关闭结果列表
    }
  },

  // 关闭信息面板
  closeInfoPanel() {
    // 清空选中的地点，隐藏信息面板
    this.setData({
      selectedPoint: null
    })
  },

  // 关闭结果列表
  closeResultList() {
    this.setData({
      showResultList: false
    })
  },

  // 开始拖动结果列表
  resultListTouchStart(e) {
    this.setData({
      startY: e.touches[0].clientY
    })
  },

  // 拖动结果列表
  resultListTouchMove(e) {
    const currentY = e.touches[0].clientY
    const moveY = currentY - this.data.startY
    let newHeight = this.data.resultListHeight - moveY

    // 限制高度范围
    if (newHeight < this.data.resultListMinHeight) {
      newHeight = this.data.resultListMinHeight
    } else if (newHeight > this.data.resultListMaxHeight) {
      newHeight = this.data.resultListMaxHeight
    }

    this.setData({
      resultListHeight: newHeight,
      startY: currentY
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
  }
})
