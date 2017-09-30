var dialog = require("../../utils/dialog.js")
var APP = getApp()
Page({

    data: {
        firendId: "",
        containerHeight: APP.systemInfo.windowHeight,
        dialog: "display:none;",

        list: [
            {
                "id": 0,
                "name": "吃饭",
                "icon": "/img/type/type_food.png"
            },
            {
                "id": 1,
                "name": "租房",
                "icon": "/img/type/type_home.png"
            },
            {
                "id": 2,
                "name": "交通",
                "icon": "/img/type/type_traffic.png"
            },
            {
                "id": 3,
                "name": "购物",
                "icon": "/img/type/type_shopping.png"
            },
            {
                "id": 4,
                "name": "蔬菜",
                "icon": "/img/type/type_vegetable.png"
            },
            {
                "id": 5,
                "name": "零食",
                "icon": "/img/type/type_snack.png"
            },
            {
                "id": 6,
                "name": "请客",
                "icon": "/img/type/type_gam.png"
            },
            {
                "id": 7,
                "name": "娱乐",
                "icon": "/img/type/type_entertainment.png"
            },
            {
                "id": 8,
                "name": "书籍",
                "icon": "/img/type/type_book.png"
            },
            {
                "id": 9,
                "name": "借款",
                "icon": "/img/type/type_money_out.png"
            },
            {
                "id": 10,
                "name": "收入",
                "icon": "/img/type/type_money_in.png"
            },
            {
                "id": 11,
                "name": "其他",
                "icon": "/img/type/type_other.png"
            },
        ],
    },


    gotoAddAccount:function(e){
        var index = e.target.dataset.index
        var item=this.data.list[index]
        
        console.log(item)
        wx.navigateTo({
            url: '/pages/new_account/new_account?type=' + item.id + "&name=" + item.name + "&typeIcon=" + item.icon,
        })
    },


    onLoad: function (option) {
        var that = this
        this.setData({
            list: this.data.list
        })

        console.log(option)
        if (option.friendId)
            this.showAddFriend(option.friendId)
        if (option.groupId)
            this.showJoinGroup(option.groupId)


    },

    /**
     * 添加好友弹窗
     */
    showAddFriend: function (friendId) {
        //查询目标好友昵称
        APP.ajax({
            url: APP.globalData.BaseUrl + "/user/get",
            data: {
                userId: friendId,
                token: wx.getStorageSync("token")
            },

            success: function (res) {
                var dialogInfo = {
                    page: this,
                    title: "提示",
                    content: "确定加[" + res.data.nickname + "]为帐友吗?",
                    callback: {
                        onConfirm: function (formId) {
                            this.inviteUser(formId, friendId)
                        },
                        onCancel: function () { }
                    }
                }

                dialog.showDialog(dialogInfo)
            }


        }, this)
    },

    /**
    * 加入到分组弹窗
    */
    showJoinGroup: function (groupId) {
        //查询目标分组昵称
        APP.ajax({
            url: APP.globalData.BaseUrl + "/group/getSimple",
            data: {
                groupId: groupId,
                token: wx.getStorageSync("token")
            },

            success: function (res) {
                var groupName = res.data.name
                var dialogInfo = {
                    page: this,
                    title: "提示",
                    content: "确定加入[" + groupName + "]组吗?",
                    callback: {
                        onConfirm: function (formId) {
                            this.joinGroup(groupId, groupName)
                        },
                        onCancel: function () { }
                    }
                }

                dialog.showDialog(dialogInfo)
            }


        }, this)
    },






    /**
     * 邀请用户
     */
    inviteUser: function (formId, friendId) {
        var that = this
        wx.login({
            success: function (res) {
                APP.ajax({
                    url: APP.globalData.BaseUrl + "/user/invite",
                    data: {
                        formId: formId,
                        token: wx.getStorageSync('token'),
                        code: res.code,
                        openid: friendId
                    },
                    success: function (res) {
                        wx.showToast({
                            title: '邀请已发出,请耐心等待接受',
                        })
                    }

                }, this)
            }
        })

    },

    /**
    * 加入分组
    */
    joinGroup: function (groupId, groupName) {
        APP.ajax({
            url: APP.globalData.BaseUrl + "/group/join",
            data: {
                groupId: groupId,
                token: wx.getStorageSync("token")
            },

            success: function (res) {
                wx.showToast({
                    title: '已成功加入到' + groupName,
                })
            }


        }, this)
    },






})

