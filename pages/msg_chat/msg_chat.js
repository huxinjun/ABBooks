//index.js
//获取应用实例
var slider
var APP = getApp()
Page({
    data: {
        containerHeight: APP.systemInfo.windowHeight, 
        datas:null

    },

    slidersInfo : {
        //N种状态
        layers: [
            {
                name: "状态一",
                //条目高度
                height: 120,
                buttons: [
                    {
                        text: "删除",
                        color: "white",
                        colorBg: "red",
                        colorShadow: "black",
                        onClick: "acceptInvite",
                        width: 150,
                        visible: true
                    },
                    {
                        text: "标记为已读",
                        color: "white",
                        colorBg: "#cdcdcd",
                        colorShadow: "black",
                        onClick: "refuseInvite",
                        width: 150,
                        visible: true
                    }
                ]
            }
        ]
    },

    getSliderData:function(index){
        if(index==undefined)
            return this.data.datas
        return this.data.datas[index]
    },
    refreshSliderData: function () {
        this.setData({
            datas:this.data.datas
        })
    },

    onItemClick:function(e){
        var index = e.target.dataset.index
        var item = this.data.datas[index]
        if(item.type==3)
            wx.navigateTo({
                url: '/pages/msg_friend/msg_friend?userId='+item.userId.encode(),
        })
        else{
            wx.navigateTo({
                url: '/pages/msg_invite/msg_invite'
            })
        }
    },

    //点击删除
    _delete: function (e) {
        APP.ajax({
            url: APP.globalData.BaseUrl + '/msg/invite/' + opt,

            data: {
                token: wx.getStorageSync("token")
            },

            success: function (res) {

            }

        }, this)
    },

    //点击标记为已读
    makeReaded: function (e, opt) {
        APP.ajax({
            url: APP.globalData.BaseUrl + '/msg/invite/' + opt,

            data: {
                token: wx.getStorageSync("token")
            },

            success: function (res) {
                
            }

        }, this)

    },



    onLoad: function () {
        console.log('onLoad')
        var that = this

        this.slidersInfo.page = this
        slider = require('../../utils/slider.js').init(this.slidersInfo)
        
    },

    onShow: function (options) {
        console.log('onShow')
        //切换页面时候需要重新初始化slider,因为require获取的是同一个对象
        slider.init(this.slidersInfo)
        this.initData()
    },

    initData: function () {
        APP.ajax({
            url: APP.globalData.BaseUrl + '/msg/chat',

            data: {
                token: wx.getStorageSync("token")
            },

            success: function (res) {
                this.data.datas = res.data.chats
                res.data.chats.forEach(function(v,i){
                    slider.setLayer(i, 0)
                })
                this.setData({
                    datas:res.data.chats
                })

            }
        }, this)
    },
})













