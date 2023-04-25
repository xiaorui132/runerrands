// pages/order/order.js

const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabList: ['全部', '我的订单', '我帮助的', '正在悬赏'],
    tabNow: 0,
    orderList: [],
    myOrder: [],
    rewardOrder: [],
    helpOrder: [],
    openid: '',
    canReceive: false,
    helpTotalNum: 0,
    helpTotalMoeny: 0
  },
  selectTab(e) {
    const {
      id
    } = e.currentTarget.dataset;
    this.setData({
      tabNow: id,
    })
    if (id === 0) {
      this.onLoad();
    } else if (id === 1) {
      this.getMyOrder();
    } else if (id === 2) {
      this.getMyHelpOrder();
    } else if (id === 3) {
      this.getRewardOrder();
    }
  },

  // 删除订单
  deleteOrder(e) {
    wx.showLoading({
      title: '处理中',
    })
    const {
      id
    } = e.currentTarget.dataset;
    wx.cloud.callFunction({
      name: 'deleteOrder',
      data: {
        _id: id
      },
      success: () => {
        wx.showToast({
          title: '删除成功',
        })
        this.getMyOrder();
        wx.hideLoading();
      },
      fail: () => {
        wx.showToast({
          icon: 'none',
          title: '删除失败',
        })
        wx.hideLoading();
      }
    })

  },

  callPhone(e) {
    const {
      phone
    } = e.currentTarget.dataset;
    wx.makePhoneCall({
      phoneNumber: phone,
    })
  },

  // 获取我帮助的订单信息 
  getMyHelpOrder() {
    wx.request({
      url: 'http://localhost:3000/getMyHelpOrder',
      data: {
        receivePerson: this.data.openid
      },
      success: (res) => {
        const {
          data
        } = res;
        data.forEach(item => {
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          helpOrder: data,
        })
        wx.hideLoading();
      }
    })
  },

  // 我帮助的订单单数总和
  getHelpTotalNum() {
    wx.request({
      url: 'http://localhost:3000/getHelpTotalNum',
      data: {
        receivePerson: wx.getStorageSync('openid')
      },
      success: (res) => {
        console.log(res);
        this.setData({
          helpTotalNum: res.data.count
        })
      }
    })
  },

  // 我帮助的订单金额总和
  getHelpTotalMoney() {
    wx.request({
      url: 'http://localhost:3000/getHelpTotalMoney',
      data: {
        receivePerson: wx.getStorageSync('openid')
      },
      success: (res) => {
        this.setData({
          helpTotalMoeny: res.data[0].totalNum
        })
      }
    })
  },

  // 获取正在悬赏的订单信息
  getRewardOrder() {
    wx.request({
      url: 'http://localhost:3000/getRewardOrder',
      success: (res) => {
        const {
          data
        } = res;
        data.forEach(item => {
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          rewardOrder: data,
        })
        wx.hideLoading();
      }
    })
  },

  // 获取我的订单信息
  getMyOrder() {
    wx.request({
      url: 'http://localhost:3000/getMyOrder',
      data: {
        openid: this.data.openid
      },
      success: (res) => {
        const {
          data
        } = res;
        data.forEach(item => {
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          myOrder: data,
        })
        wx.hideLoading();
      }
    })
  },

  // 点击接单
  orderReceive(e) {
    if (this.data.canReceive) {

      const {
        item
      } = e.currentTarget.dataset;
      const {
        _id
      } = item;

      wx.request({
        url: 'http://localhost:3000/toGetOrder',
        data: {
          receivePerson: this.data.openid,
          _id
        },
        success: (res) => {
          if (res.data === "success") {
            if (this.data.tabNow === 0) {
              this.onLoad();
            } else {
              this.getRewardOrder();
            }
            wx.hideLoading();
          } else {
            wx.showToast({
              icon: "none",
              title: '接单失败',
            })
          }
        },
      })
    } else {
      wx.showModal({
        title: '提示',
        showCancel: false,
        content: '您目前不是接单员, 请前往个人中心申请成为接单员!'
      })
    }

  },

  async toFinish(e) {

    const {
      item
    } = e.currentTarget.dataset;
    const {
      _id: orderID,
      receivePerson,
      money
    } = item;

    wx.request({
      url: 'http://localhost:3000/toFinishOrder',
      data: {
        _id
      },
      success: (res) => {
        if (res.data === "success") {
          this.getMyOrder();
          wx.hideLoading();
        } else {
          wx.showToast({
            icon: "none",
            title: '操作失败',
          })
        }
      }
    })
  },

  formatInfo(orderInfo) {
    const {
      name,
      info,
    } = orderInfo;
    if (name === '快递代取') {
      const {
        business,
        expectGender,
        expectTime,
        number,
        remark,
        size,
      } = info;
      return `快递类型: ${size} -- 快递数量: ${number}个 -- 快递商家: ${business} -- 期望送达: ${expectTime} -- 性别限制: ${expectGender} -- 备注: ${remark}`;
    } else if (name === '打印服务') {
      const {
        colorPrint,
        pageNum,
        remark,
        twoSided
      } = info;
      return `页数: ${pageNum} -- 是否彩印: ${colorPrint ? '是' : '否'} -- 是否双面: ${twoSided ? '是' : '否'} -- 备注: ${remark}`;
    } else if (name === '校园跑腿') {
      const {
        helpContent,
        pickUpAddress
      } = info;
      return `帮助内容: ${helpContent} -- 取货地点: ${pickUpAddress}`;
    } else if (name === '快递代寄') {
      const {
        helpContent,
        business,
        remark
      } = info;
      return `帮助内容: ${helpContent} -- 快递商家: ${business} -- 备注: ${remark}`;
    } else if (name === '租借服务') {
      const {
        leaseItem,
        leaseTime,
        deliveryTime
      } = info;
      return `租借物品: ${leaseItem} -- 租借时长: ${leaseTime} -- 预计交货时间: ${deliveryTime}`;
    } else if (name === '游戏陪玩') {
      const {
        gameID,
        gameName,
        gameTime,
        remark
      } = info;
      return `游戏名称: ${gameName} -- 游戏时间or盘数: ${gameTime} -- 游戏ID: ${gameID} -- 备注信息: ${remark}`;
    } else if (name === '帮我送') {
      const {
        deliveryInfo
      } = info;
      return `送达地点: ${deliveryInfo}`;
    } else if (name === '代替服务') {
      const {
        helpContent
      } = info;
      return `帮助内容: ${helpContent}`;
    } else if (name === '其它帮助') {
      const {
        helpContent
      } = info;
      return `帮助内容: ${helpContent}`;
    }
  },

  formatState(state) {
    if (state === '待帮助') {
      return 'top_right';
    } else if (state === '已帮助') {
      return 'top_right_help';
    } else if (state === '已完成') {
      return 'top_right_finish';
    }
  },

  getPersonPower() {
    wx.request({
      url: 'http://localhost:3000/getPersonPower',
      date: {
        openid: wx.getStorageSync('openid'),
      },
      success: (res) => {
        this.setData({
          canReceive: !!res.data.length
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.getPersonPower();
    wx.request({
      url: 'http://localhost:3000/getAllOrder',
      success: (res) => {
        const {
          data
        } = res;
        console.log(data);
        data.forEach(item => {
          if (item.name === "快递代取" && item.info.expressCode) {
            item.expressCode = item.info.expressCode;
          }
          if (item.name === "快递代取" && item.info.codeImg) {
            item.codeImg = item.info.codeImg;
          }
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          orderList: data,
          openid: wx.getStorageSync('openid')
        })
        wx.hideLoading();
      },
    })
  },

  showCodeImg(e) {
    const {
      item: {
        codeImg,
        state,
        receivePerson
      }
    } = e.currentTarget.dataset;
    console.log(codeImg, state, receivePerson);
    if (state !== '已帮助' || receivePerson !== this.data.openid) {
      wx.showToast({
        icon: 'none',
        title: '无权查看!',
      })
      return;
    }
    wx.previewImage({
      urls: [codeImg],
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
    this.onLoad();
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

    let {
      orderList,
      myOrder,
      rewardOrder,
      helpOrder,
      tabNow,
      openid
    } = this.data;

    if (tabNow === 0) {
      db.collection('order').orderBy('createTime', 'desc').skip(orderList.length).get({
        success: (res) => {
          if (res.data.length) {
            res.data.forEach(item => {
              if (item.name === "快递代取" && item.info.expressCode) {
                item.expressCode = item.info.expressCode;
              }
              if (item.name === "快递代取" && item.info.codeImg) {
                item.codeImg = item.info.codeImg;
              }
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              orderList.push(item);
            })
            this.setData({
              orderList,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
        },
      })
    } else if (tabNow === 1) {
      db.collection('order').orderBy('createTime', 'desc').skip(myOrder.length).where({
        _openid: openid
      }).get({
        success: (res) => {
          if (res.data.length) {
            const {
              data
            } = res;
            data.forEach(item => {
              if (item.name === "快递代取" && item.info.expressCode) {
                item.expressCode = item.info.expressCode;
              }
              if (item.name === "快递代取" && item.info.codeImg) {
                item.codeImg = item.info.codeImg;
              }
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              myOrder.push(item);
            });
            this.setData({
              myOrder,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
          wx.hideLoading();
        }
      })
    } else if (tabNow === 2) {
      db.collection('order').orderBy('createTime', 'desc').skip(helpOrder.length).where({
        receivePerson: this.data.openid,
        state: '已完成'
      }).get({
        success: (res) => {
          if (res.data.length) {
            const {
              data
            } = res;
            data.forEach(item => {
              if (item.name === "快递代取" && item.info.expressCode) {
                item.expressCode = item.info.expressCode;
              }
              if (item.name === "快递代取" && item.info.codeImg) {
                item.codeImg = item.info.codeImg;
              }
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              helpOrder.push(item);
            });
            this.setData({
              helpOrder,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
          wx.hideLoading();
        }
      })
    } else if (tabNow === 3) {
      db.collection('order').orderBy('createTime', 'desc').skip(rewardOrder.length).where({
        state: '待帮助'
      }).get({
        success: (res) => {
          if (res.data.length) {
            const {
              data
            } = res;
            data.forEach(item => {
              if (item.name === "快递代取" && item.info.expressCode) {
                item.expressCode = item.info.expressCode;
              }
              if (item.name === "快递代取" && item.info.codeImg) {
                item.codeImg = item.info.codeImg;
              }
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              rewardOrder.push(item);
            });
            this.setData({
              rewardOrder,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
          wx.hideLoading();
        }
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})