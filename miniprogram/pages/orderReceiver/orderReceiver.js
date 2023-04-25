// pages/orderReceiver/orderReceiver.js
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    receiveList: [],
  },

  // 审核内容
  toExamine(e) {
    wx.showLoading({
      title: '加载中',
    })
    const { item: { _id }, name } = e.currentTarget.dataset;
wx.request({
  url: 'http://localhost:3000/updateOrderReceive',
  method:'POST',
  data:{
    _id,
    state:name,
    examinePerson:wx.getStorageSync('openid')
  },
  success:(res)=>{
    const {data} =res;
    if(data==="success") {
      this.onLoad();
      wx.hideLoading();
    }else{
      wx.showToast({
        title: '操作失败',
      })
    }
  }
})
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.request({
      url: 'http://localhost:3000/getOrderReceive',
      success: (res) => { 
        this.setData({
          receiveList:res.data
        }) 
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})