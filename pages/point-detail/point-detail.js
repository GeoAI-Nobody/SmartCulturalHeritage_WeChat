/**
 * pages/point-detail/point-detail.js
 * 
 * 村落点详情页面的主要逻辑文件
 * 
 * 该页面负责显示单个村落的详细信息，包括：
 * 1. 村落的基本信息（名称、位置、建村年代等）
 * 2. 村落的属性信息（地形地貌、建筑形式、姓氏结构等）
 * 3. 可选的村落图片展示
 * 
 * 用户可以通过地图页面、分栏视图页面或属性查询页面跳转到该页面。
 */

// 获取全局应用实例，用于访问全局数据
const app = getApp()

Page({
  /**
   * 用户点击右上角分享时触发
   * 实现分享当前查看的村落详情页面
   * @returns {Object} 分享配置信息
   */
  onShareAppMessage: function() {
    const point = this.data.point;
    
    // 如果有村落数据，则分享该村落的详情页面
    if (point) {
      return {
        // 分享标题包含村落名称
        title: `梅州传统村落 - ${point.village}`,
        // 分享路径包含县镇村参数，便于接收方直接打开该村落详情
        path: `/pages/point-detail/point-detail?county=${encodeURIComponent(point.county)}&town=${encodeURIComponent(point.town)}&village=${encodeURIComponent(point.village)}`,
        imageUrl: '/images/share-cover.png' // 自定义分享图片
      };
    }
    
    // 如果没有村落数据（异常情况），则分享到地图页面
    return {
      title: '梅州传统村落',
      path: '/pages/map/map'
    };
  },
  
  /**
   * 页面的初始数据对象
   * 定义了村落详情页面所需的状态和数据
   */
  data: {
    point: null,              // 当前显示的村落详细信息对象
    showImages: false         // 是否显示村落图片的开关状态，默认关闭
  },

  /**
   * 页面加载时触发的生命周期函数
   * 接收从其他页面传递的县镇村参数，并加载对应村落的详细信息
   * @param {Object} options - 页面参数对象，包含 county、town、village 信息
   */
  onLoad(options) {
    // 解析传入的县镇村参数
    const { county, town, village } = options
    // 根据参数加载对应村落的详细信息
    this.loadPointDetail(county, town, village)
  },

  /**
   * 根据县镇村信息加载村落详细信息
   * 从全局数据中查找对应的村落数据，并转换为页面显示所需的格式
   * @param {string} county - 县名
   * @param {string} town - 镇名
   * @param {string} village - 村名
   */
  loadPointDetail(county, town, village) {
    // 从全局数据中获取所有村落点数据
    const allPoints = app.globalData.mapPoints || []
    
    // 根据县镇村信息查找对应的村落数据
    // 注意：需要先解码URL参数中的中文字符
    const point = allPoints.find(p => 
      p.县 === decodeURIComponent(county) && 
      p.镇 === decodeURIComponent(town) && 
      p.村 === decodeURIComponent(village)
    )
    
    if (point) {
      // 找到村落数据，转换为英文属性名并更新页面显示
      const convertedPoint = this.convertPoint(point)
      this.setData({ point: convertedPoint })
    } else {
      // 未找到村落数据，显示错误提示并返回上一页
      wx.showToast({
        title: '未找到该村落',
        icon: 'none'
      })
      // 1.5秒后自动返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 将中文属性名转换为英文属性名
   * 将原始数据中的中文属性名转换为英文属性名，便于前端开发和数据处理
   * 同时补充一些页面显示所需的额外信息
   * @param {Object} point - 原始村落数据对象（中文属性名）
   * @returns {Object} 转换后的村落数据对象（英文属性名）
   */
  convertPoint(point) {
    // 如果没有数据，返回null
    if (!point) return null;
    
    // 创建一个新对象，使用英文属性名
    return {
      // 基本信息
      id: point.id,                      // ID
      county: point.县,                // 县名
      town: point.镇,                  // 镇名
      village: point.村,               // 村名
      name: point.村,                  // 名称（使用村名）
      LATI: point.LATI,                  // 纬度
      LONG: point.LONG,                  // 经度
      
      // 村落属性
      buildingForm: point.主要建筑形式,  // 主要建筑形式
      foundingYear: point.建村年代,      // 建村年代
      buildYear: point.建村年代,        // 建筑年代（同建村年代）
      buildReason: point.形成原因,      // 形成原因
      terrain: point.地形地貌,          // 地形地貌
      villageScale: point.村落规模,     // 村落规模
      mainSurname: point.主要姓氏,      // 主要姓氏
      historicalBuilding: point.历史建筑, // 历史建筑
      
      // 页面显示用的组合信息
      address: `${point.县} ${point.镇} ${point.村}`,  // 完整地址
      // 村落描述信息，由多个属性组合生成
      description: `${point.村}位于${point.县}${point.镇}，建村于${point.建村年代 || '未知年代'}，${point.形成原因 ? '形成原因是' + point.形成原因 : ''}。`,
      
      // 页面展示用的附加信息（模拟数据）
      rating: point.评级 || '4.5',         // 评分
      visitCount: 1000,                       // 默认访问量
      openTime: '全天开放',         // 开放时间
      phone: '暂无',                    // 联系电话
      // 标签数组，由村落属性生成
      tags: ['传统村落', point.主要建筑形式 || '传统建筑', point.建村年代 || '历史村落'],
      images: [],                             // 默认无图片
      
      // 保留原始数据，便于需要时访问其他属性
      originalData: point
    };
  },

  // 切换图片显示状态
  toggleImages(e) {
    // 从开关组件的事件中获取当前状态值
    this.setData({
      showImages: e.detail.value  // true表示显示图片，false表示隐藏图片
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 将地点类型转换为中文显示文本
  getTypeText(type) {
    if (!type) return '传统村落';
    
    // 直接返回建筑形式，因为已经是中文
    return type;
  },

  // 格式化访问量显示，超过1万显示为"x.x万"
  formatVisitCount(count) {
    if (count >= 10000) {
      // 将访问量除以10000，保留一位小数，然后加上"万"字
      return (count / 10000).toFixed(1) + '万'
    }
    // 小于1万直接返回数字字符串
    return count.toString()
  }
})
