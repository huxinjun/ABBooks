var APP = getApp()
var dialog = require("../../utils/dialog.js")
var util = require('../../utils/util.js')
Page({
    data: {
        containerHeight: APP.systemInfo.windowHeight
    },


    /**
     * 点击展开或合上成员付款详情的按钮
     */
    onMembersPullDownClick: function (e) {
        console.log("onMembersPullDownClick")

        var index = e.target.dataset.index
        var account = this.data.accounts[index]
        account.value.showMemberDetail = !account.value.showMemberDetail

        if (account.value.showMemberDetail) {
            account.style.membersSimpleOpacity = "opacity:0;"
            account.style.membersDetailHeight = "height:" + (account.members.length * 60) + "rpx;"
            account.style.membersPullDownTrans = "transform: rotate(180deg);"
        } else {
            account.style.membersSimpleOpacity = "opacity:1;"
            account.style.membersDetailHeight = "height:0;"
            account.style.membersPullDownTrans = "transform: rotate(0deg);"
        }

        this.setData({
            accounts: this.data.accounts
        })
    },

    /**
     * 点击全文按钮
     */
    onShowAllContentClick: function (e) {
        var index = e.target.dataset.index
        var account = this.data.accounts[index]
        account.value.isShowAllContent = !account.value.isShowAllContent

        if (account.value.isShowAllContent){
            //已经显示全部文字了,点击后显示部分文字
            account.description = account.descriptionSimple
            account.value.allContentBtnText = "展开"
        }else{
            account.description = account.descriptionFull
            account.value.allContentBtnText = "合上"
        }
        this.setData({
            accounts: this.data.accounts
        })
    },

    /**
     * 预览头像
     */
    iconPreview: function (e) {
        var accountid = e.target.dataset.accountid
        var index = e.target.dataset.index

        var imgs = this.data.accounts.findByAttr("id", accountid).imgs

        
        wx.previewImage({
            urls: imgs,
            current:imgs[index]
        })
    },


    onLoad: function (option) {

        var that = this

        this.onPullDownRefresh()

    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh:function(){
        if (this.data.userInfo)
            this.initAccounts()
        else
            this.initSelfInfo()
    },

    /**
     * 初始化和自己的信息:id,name,icon
     */
    initSelfInfo: function () {
        APP.ajax({
            url: APP.globalData.BaseUrl + '/user/getSelfSimple',
            data: {
                token: wx.getStorageSync("token")
            },
            success: function (res) {
                this.data.userInfo = res.data
                this.initAccounts()
            }

        }, this)
    },


    /**
     * 初始化账目列表数据
     */
    initAccounts: function () {
        var that=this
        APP.ajax({
            url: APP.globalData.BaseUrl + '/account/get',
            data: {
                token: wx.getStorageSync("token")
            },

            success: function (res) {
                res.data.accounts.forEach(function (v, i) {
                    v.style = {}
                    v.value = {
                        //成员详情是否显示标记
                        showMemberDetail: false
                    }

                    //类型图标处理
                    v.icon = APP.globalData.typeList.findByAttr("id", v.type).icon

                    //描述内容处理
                    var maxLength = 40
                    if (v.description.length > maxLength) {
                        v.value.showAllContentBtn = true
                        v.descriptionFull = v.description
                        v.descriptionSimple = v.descriptionFull.substr(0, maxLength) + "..."
                        v.description = v.descriptionSimple
                        v.value.isShowAllContent = false
                        v.value.allContentBtnText="展开"
                    } else
                        v.value.showAllContentBtn = false


                    //付款方案中加入需要的用户头像
                    if (v.payResult && v.payResult[0]) {
                        v.payResult[0].payTarget.forEach(function (target, index) {
                            target.value={}
                            target.style={}
                            var paidMember = v.members.findByAttr("memberId", target.paidId)
                            var receiptMember = v.members.findByAttr("memberId", target.receiptId)
                            target.paidIcon = paidMember.memberIcon
                            target.receiptIcon = receiptMember.memberIcon
                            //确定是否显示操作按钮,及显示的文字
                            /**
                             * 显示收款,付款,完善账单按钮逻辑:
                             * 1.如果is_group==false and memberid==当前用户显示,否则不显示
                             * 2.如果is_group==true,那么查看当前用户是否为这个组的成员,如果是显示,否则不显示
                             * 3.如果显示:那么查看该member是收款还是付款
                             *      如果是收款:收款
                             *      如果是付款:付款
                             *      如果是组并且没有完善子账单:完善账单
                             */
                            if (that.data.userInfo.id == paidMember.memberId){
                                target.value.showBtn=true
                                target.value.btnText = "付款"
                                return
                            }
                            if (that.data.userInfo.id == receiptMember.memberId) {
                                target.value.showBtn = true
                                target.value.btnText = "收款"
                                return
                            }
                            if (paidMember.isGroup && paidMember.isMember && !target.settled){
                                //我在这个组内
                                target.value.showBtn = true
                                target.value.btnText = "完善账单"
                                return
                            }
                            if (receiptMember.isGroup && receiptMember.isMember && !target.settled) {
                                //我在这个组内
                                target.value.showBtn = true
                                target.value.btnText = "完善账单"
                                return
                            }
                                
                        })
                    }

                })
                this.setData({
                    accounts: res.data.accounts
                })

                console.log(res.data.accounts)
                wx.stopPullDownRefresh()
            }

        }, this)
    }

})










