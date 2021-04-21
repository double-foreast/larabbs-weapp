import wepy from 'wepy'

// 服务器接口地址
const host = 'http://larabbs.test/api'

// 普通请求
const request = async (options, showLoading = true) => {
  // 简化开发，如果传入字符串则转换成 对象
  if (typeof options === 'string'){
    options = {
      url: options
    }
  }
  // 拼接请求地址
  options.url = host + '/' + options.url
  // 调用小程序的 request 方法
  let response = await wepy.request(options)

  if (showLoading){
    // 隐藏加载中
    wepy.hideLoading()
  }

  // 服务器异常后给与提示
  if (response.statusCode === 500){
    wepy.showModal({
      title: '提示request',
      content: '服务器错误，请联系管理员或重试'
    })
  }
  return response
}

//登录
const login = async (params = {}) => {
  // code 只能使用一次，所有每次单独调用
  let loginData = await wepy.login()

  // 参数中增加code
  params.code = loginData.code
  console.log('login-request' + params)
  // 接口请求 weapp-authorizations
  let authResponse = await request({
    url: 'weapp/authorizations',
    data: params,
    method: 'POST'
  })

  // 登录成功，记录 token 信息
  if (authResponse.statusCode === 201){
    wepy.setStorageSync('access_token', authResponse.data.access_token)
    wepy.setStorageSync('access_token_expired_at', new Date().getTime() + authResponse.data.expires_in * 1000)
  }
  console.log('login-response' + authResponse)
  return authResponse
}

const refreshToken = async (token) => {
  console.log('refreshToken' + token)
  let refreshResponse = await request({
    url: 'authorizations',
    method: 'PUT',
    header: {
      'Authorization': 'Bearer ' + token
    }
  },false)

  if (refreshResponse.statusCode === 200){
    wepy.setStorageSync('access_token', refreshResponse.data.access_token)
    wepy.setStorageSync('access_token_expired_at', new Date().getTime() + refreshResponse.data.expires_in * 1000)
  }
  console.log('refreshToken-response' + refreshResponse)
  return refreshResponse
}

const getToken = async (options) => {
  // 本地storage
  let access_token = wepy.getStorageSync('access_token')
  let access_token_expired_at = wepy.getStorageSync('access_token_expired_at')

  if (access_token){
    // 未过期
    if (new Date().getTime() < access_token_expired_at){
      return access_token
    }
    // 过期刷新
    let refreshResponse = await refreshToken(access_token)
    if (refreshResponse.statusCode === 200){
      return refreshResponse.data.access_token
    }
  }

  // 未存储 或 刷新失败重新获取
  let loginResponse = await login()
  if (loginResponse.statusCode === 201){
    return loginResponse.data.access_token
  }
}

const authRequest = async (options, showLoading = true) => {
  console.log('authRequest' + options)
  let access_token = await getToken()
  console.log('authRequest-access_token' + access_token)
  if (typeof options === 'string'){
    options = {
      url: options
    }
  }

  let header = options.header || {}
  header.Authorization = 'Bearer ' + access_token
  options.header = header
  return request(options, showLoading)
}

const logout = async (params = {}) => {
  console.log('logout')
  let access_token = wepy.getStorageSync('access_token')
  console.log('logout' + access_token)
  let logoutResponse = await request({
    url: 'authorizations',
    method: 'DELETE',
    header: {
      'Authorization': 'Bearer ' + access_token
    }
  }, false)
  console.log('logout-response' + logoutResponse)
  if (logoutResponse.statusCode === 204){
    wepy.clearStorage()
  }
  return logoutResponse
}

const updateFile = async (options = {}) => {
  wepy.showLoading({title: '上传中'})
  let accessToken = await getToken()
  let header = options.header || {}
  header.Authorization = 'Bearer ' + accessToken
  options.header = header
  options.url = host + '/' + options.url
  let response = await wepy.uploadFile(options)
  wepy.hideLoading()
  return response
}

export default {
  request,
  login,
  refreshToken,
  authRequest,
  logout,
  updateFile
}
