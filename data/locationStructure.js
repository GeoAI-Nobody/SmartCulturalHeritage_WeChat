/**
 * data/locationStructure.js
 * 
 * 梅州传统村落的县镇村结构化数据模块
 * 
 * 该模块将原始的村落数据转换为层级结构，方便在小程序中进行县镇村三级联动选择。
 * 结构化后的数据格式为：
 * {
 *   counties: [
 *     {
 *       name: '县名',
 *       towns: [
 *         {
 *           name: '镇名',
 *           villages: [
 *             { name: '村名' },
 *             ...
 *           ]
 *         },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 * }
 */

// 导入原始村落数据
import jsonData from './villageData.js'

/**
 * 构建结构化的县镇村数据
 * 该函数将原始的村落数据转换为层级结构化的格式
 * @returns {Object} 结构化后的县镇村数据
 */
const buildLocationStructure = () => {
  // 初始化一个对象来存储县镇村结构
  const structure = {}
  
  // 第一步：遍历所有数据点，构建县镇村层级结构
  jsonData.forEach(point => {
    const county = point.县    // 县名
    const town = point.镇      // 镇名
    const village = point.村   // 村名
    
    // 跳过没有县信息的数据点
    if (!county) return
    
    // 如果县不存在，创建县对象
    if (!structure[county]) {
      structure[county] = {
        name: county,       // 县名
        towns: {}          // 镇对象集合
      }
    }
    
    // 跳过没有镇信息的数据点
    if (!town) return
    
    // 如果镇不存在，创建镇对象
    if (!structure[county].towns[town]) {
      structure[county].towns[town] = {
        name: town,         // 镇名
        villages: {}        // 村对象集合
      }
    }
    
    // 跳过没有村信息的数据点
    if (!village) return
    
    // 如果村不存在，创建村对象
    if (!structure[county].towns[town].villages[village]) {
      structure[county].towns[town].villages[village] = {
        name: village       // 村名
      }
    }
  })
  
  // 第二步：转换为更易于使用的数组格式
  const result = {
    counties: []           // 县数组
  }
  
  // 将县对象转换为数组
  Object.keys(structure).forEach(countyName => {
    const county = structure[countyName]
    const countyObj = {
      name: county.name,    // 县名
      towns: []            // 镇数组
    }
    
    // 将镇对象转换为数组
    Object.keys(county.towns).forEach(townName => {
      const town = county.towns[townName]
      const townObj = {
        name: town.name,    // 镇名
        villages: []        // 村数组
      }
      
      // 将村对象转换为数组
      Object.keys(town.villages).forEach(villageName => {
        const village = town.villages[villageName]
        townObj.villages.push({
          name: village.name  // 村名
        })
      })
      
      // 按村名称排序（使用中文排序）
      townObj.villages.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
      countyObj.towns.push(townObj)
    })
    
    // 按镇名称排序（使用中文排序）
    countyObj.towns.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    result.counties.push(countyObj)
  })
  
  // 按县名称排序（使用中文排序）
  result.counties.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  
  return result
}

// 构建并导出结构化数据
const locationStructure = buildLocationStructure()
export default locationStructure