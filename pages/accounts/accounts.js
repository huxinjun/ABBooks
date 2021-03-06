var APP = getApp()
var dialog = require("../../utils/dialog.js")
var util = require('../../utils/util.js')
var isLoading = false
Page({
    data: {
        containerHeight: APP.systemInfo.windowHeight,

        banner: "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1509096167729&di=82f605348e2b14d2c6103619d9ec751b&imgtype=0&src=http%3A%2F%2Fa.hiphotos.baidu.com%2Fimage%2Fpic%2Fitem%2F50da81cb39dbb6fda2d331e50324ab18962b376d.jpg"
    },


    /**
     * 更新用户头像
     */
    updateUserIcon: function () {
        APP.ajax({
            url: APP.globalData.BaseUrl + '/user/updateIcon',
            data: {
                token: wx.getStorageSync("token")
            },
            success: function (res) {
                wx.showToast({
                    title: res.data.msg,
                })
                this.data.userInfo = null
                wx.startPullDownRefresh()
            }

        }, this)
    },

    onAccountItemClick: function (e) {
        console.log("onAccountItemClick")

        var index = e.target.dataset.index
        var account = this.data.accounts[index]

        if (index != undefined) {
            wx.navigateTo({
                url: '/pages/account/account?accountId=' + account.id.encode()
            })
        }
    },


    /**
     * 点击展开或合上成员付款详情的按钮
     */
    onMembersPullDownClick: function (e) {
        console.log("onMembersPullDownClick")

        var index = e.target.dataset.index
        var account = this.data.accounts[index]

        if (index == undefined)
            return

        account.value.showMemberDetail = !account.value.showMemberDetail

        if (account.value.showMemberDetail) {
            account.style.membersSimpleOpacity = "opacity:0;"
            account.style.membersDetailHeight = "height:" + (account.membersLength * 80) + "rpx;opacity:1;"
            account.style.membersPullDownTrans = "transform: rotate(180deg);"
        } else {
            account.style.membersSimpleOpacity = "opacity:1;"
            account.style.membersDetailHeight = "height:0;opacity:0;"
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

        if (account.value.isShowAllContent) {
            //已经显示全部文字了,点击后显示部分文字
            account.description = account.descriptionSimple
            account.value.allContentBtnText = "展开"
        } else {
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
            current: imgs[index]
        })
    },

    /**
     * 标记为付款或者收款
     */
    settle: function (accountId, targetId) {
        var account = this.data.accounts.findByAttr("id", accountId)
        var target = account.payResult[0].payTarget.findByAttr("id", targetId)

        var isPay = this.data.userInfo.id == target.paidId
        var ohtherMember = account.originMembers.findByAttr("memberId", isPay ? target.receiptId : target.paidId)
        var content
        if (isPay)
            content = "确定要付款给[" + ohtherMember.memberName + "]" + target.waitPaidMoney + "元吗?此操作不可回退!"
        else
            content = "确定要向[" + ohtherMember.memberName + "]收取" + target.waitPaidMoney + "元吗?此操作不可回退!"

        var that = this
        var dialogInfo = {
            page: this,
            title: "提示",
            content: content,
            callback: {
                onConfirm: function () {
                    //请求服务器
                    APP.ajax({
                        url: APP.globalData.BaseUrl + '/account/settle',
                        data: {
                            token: wx.getStorageSync("token"),
                            accountId: accountId,
                            targetId: targetId
                        },
                        success: function (res) {
                            if (res.data.status == 0) {
                                var account = this.data.accounts.findByAttr("id", accountId)
                                var target = account.payResult[0].payTarget.findByAttr("id", targetId)
                                target.waitPaidMoney = 0
                                target.value.showBtn = false
                                this.setData({
                                    accounts: this.data.accounts
                                })
                                wx.showToast({
                                    title: res.data.msg
                                })
                            } else {
                                wx.showToast({
                                    image: "/img/error.png",
                                    title: res.data.msg
                                })
                            }

                        }

                    }, this)

                }
            }
        }

        dialog.showDialog(dialogInfo)
    },

    /**
     * 点击付款收款或者完善账单按钮
     */
    onPayClick: function (e) {
        var accountId = e.target.dataset.accountid
        var targetId = e.target.dataset.targetid

        var account = this.data.accounts.findByAttr("id", accountId)
        var target = account.payResult[0].payTarget.findByAttr("id", targetId)

        //是付款或者收款按钮
        if (target.value.canSettle == true) {
            this.settle(accountId, targetId)
            return
        }

        //完善账单
        var paidMember = account.originMembers.findByAttr("memberId", target.paidId)
        var receiptMember = account.originMembers.findByAttr("memberId", target.receiptId)
        var memberId
        if (paidMember.isGroup && paidMember.isMember)
            memberId = paidMember.memberId
        else
            memberId = receiptMember.memberId

        console.log("accountId:" + accountId)
        console.log("memberId:" + memberId)
        console.log("targetId:" + targetId)

        wx.navigateTo({
            url: '/pages/account_group/account_group?accountId=' + accountId.encode() + "&memberId=" + memberId.encode() + "&targetId=" + targetId.encode()
        })


    },


    onLoad: function (option) {

        var that = this

        this.onPullDownRefresh()
    },

    onShow: function (option) {

    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh: function () {
        this.data.accounts = []
        this.initSummaryInfo()
        if (this.data.userInfo)
            this.getAccounts()
        else
            this.initSelfInfo()
    },

    /**
     * 到底部,加载更多
     */
    onReachBottom: function () {
        if (isLoading)
            return

        if (!this.data.hasNextPage)
            return

        isLoading = true

        this.getAccounts(this.data.nextPageIndex)

    },
    onPageScroll: function () {
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
                this.setData({
                    userInfo: res.data
                })
                this.getAccounts()
            }

        }, this)
    },

    /**
     * 初始化账户统计信息
     */
    initSummaryInfo: function () {
        APP.ajax({
            url: APP.globalData.BaseUrl + '/summary/getSimple',
            data: {
                token: wx.getStorageSync("token")
            },
            success: function (res) {
                var that = this
                var summaryInfos = res.data.infos

                if (summaryInfos)
                    //单人
                    summaryInfos.forEach(function (v, i) {

                        v.style = {}
                        v.value = {}
                        switch (v.name) {
                            case "wait_paid":
                                v.value.name = "待付"
                                v.value.unit = "元"
                                v.style.color = "color:Crimson;"
                                break;
                            case "wait_receipt":
                                v.value.name = "待收"
                                v.value.unit = "元"
                                v.style.color = "color:SeaGreen;"
                                break;
                            case "month_paidin":
                                v.value.name = "月支出"
                                v.value.unit = "元"
                                break;
                            case "month_sr":
                                v.value.name = "月收入"
                                v.value.unit = "元"
                                break;
                            case "wait_edit":
                                v.value.name = "待完善账单"
                                v.value.unit = "笔"
                                break;
                        }
                    })
                var summaryLInfos = [summaryInfos[0], summaryInfos[1]]
                var summaryRInfos = [summaryInfos[2], summaryInfos[3], summaryInfos[4]]

                this.setData({
                    summaryInfos: summaryInfos,
                    summaryLInfos: summaryLInfos,
                    summaryRInfos: summaryRInfos
                })
            }

        }, this)
    },


    /**
     * 初始化账目列表数据
     */
    getAccounts: function (pageIndex) {
        var that = this
        APP.ajax({
            url: APP.globalData.BaseUrl + '/account/getAll',
            data: {
                token: wx.getStorageSync("token"),
                pageIndex: pageIndex != undefined ? pageIndex : 0,
                pageSize: 10
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
                        v.value.allContentBtnText = "展开"
                    } else
                        v.value.showAllContentBtn = false

                    v.membersLength = v.members.length
                    v.originMembers = util.clone(v.members)


                    //借款与还款两种账单的特殊处理
                    if (v.type == 'jk' || v.type == 'hk' || v.type == 'sr') {
                        switch (v.type) {
                            case 'sr':
                                v.value.state = 0
                                v.value.bg = '/img/accounts/envelope_sr.png'
                                v.value.desc = "收入"
                                break;
                            case 'jk':
                                var target = v.payResult[0].payTarget[0]
                                //如果自己是借款人,那就是收入
                                if (that.data.userInfo.id == target.paidId) {
                                    v.value.state = 1
                                    v.value.bg = '/img/accounts/envelope_sk.png'
                                    v.value.dollar = '/img/accounts/dollar_red.png'

                                    var ohtherMember = v.originMembers.findByAttr("memberId", target.receiptId)
                                    v.value.icon = ohtherMember.memberIcon
                                    v.value.desc = "[" + that.data.userInfo.name + "]收到[" + ohtherMember.memberName + "]的借款(借入)"
                                    v.name = "收到借款"
                                } else {
                                    v.value.state = -1
                                    v.value.bg = '/img/accounts/envelope_fk.png'
                                    v.value.dollar = '/img/accounts/dollar_yellow.png'

                                    var ohtherMember = v.originMembers.findByAttr("memberId", target.paidId)
                                    v.value.icon = ohtherMember.memberIcon
                                    v.value.desc = "[" + that.data.userInfo.name + "]向[" + ohtherMember.memberName + "]借款(借出)"
                                    v.name = "借款借出"
                                }
                                //这笔账已经抵消或者已收
                                v.style.moneyColor = target.waitPaidMoney == 0 ? "color:#000;opacity:0.1;" : ""
                                break;
                            case 'hk':
                                var target = v.payResult[0].payTarget[0]
                                //如果自己是还款人,那就是支出
                                if (that.data.userInfo.id == target.paidId) {
                                    v.value.state = -1
                                    v.value.bg = '/img/accounts/envelope_fk.png'
                                    v.value.dollar = '/img/accounts/dollar_yellow.png'

                                    var ohtherMember = v.originMembers.findByAttr("memberId", target.receiptId)
                                    v.value.icon = ohtherMember.memberIcon
                                    v.value.desc = "[" + that.data.userInfo.name + "]向[" + ohtherMember.memberName + "]还款(支出)"
                                    v.name = "还款支出"
                                } else {
                                    v.value.state = 1
                                    v.value.bg = '/img/accounts/envelope_sk.png'
                                    v.value.dollar = '/img/accounts/dollar_red.png'

                                    var ohtherMember = v.originMembers.findByAttr("memberId", target.paidId)
                                    v.value.icon = ohtherMember.memberIcon
                                    v.value.desc = "[" + that.data.userInfo.name + "]收到[" + ohtherMember.memberName + "]的还款(收入)"
                                    v.name = "收到还款"
                                }
                                //这笔账已经抵消或者已还，已收
                                v.style.moneyColor = target.waitPaidMoney == 0 ? "color:#000;opacity:0.1;" : ""
                                break;
                        }
                        return
                    }

                    v.value.state = 3





                    //子成员处理
                    for (var i = 0; i < v.members.length; i++) {
                        var member = v.members[i]
                        if (member.parentMemberId != null) {
                            var parentMember = v.members.findByAttr("memberId", member.parentMemberId)
                            if (!parentMember.members)
                                parentMember.members = []
                            parentMember.members.push(member)
                            v.members.splice(i--, 1)
                        }
                    }

                    //付款方案中加入需要的用户头像
                    if (v.payResult && v.payResult[0]) {

                        var targets = v.payResult[0].payTarget


                        targets.forEach(function (target, index) {
                            target.value = {}
                            target.style = {}
                            var paidMember = v.originMembers.findByAttr("memberId", target.paidId)
                            var receiptMember = v.originMembers.findByAttr("memberId", target.receiptId)
                            if (paidMember == undefined || receiptMember == undefined)
                                return
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
                            if (that.data.userInfo.id == paidMember.memberId && target.waitPaidMoney > 0) {
                                target.value.showBtn = true
                                target.value.btnText = "付款"
                                target.value.canSettle = true
                                target.style.bg = "background-color: salmon;"
                                return
                            }
                            if (that.data.userInfo.id == receiptMember.memberId && target.waitPaidMoney > 0) {
                                target.value.showBtn = true
                                target.value.btnText = "收款"
                                target.value.canSettle = true
                                target.style.bg = "background-color: SeaGreen;"
                                return
                            }
                            if (paidMember.isGroup && paidMember.isMember && target.paidStatus == 1) {
                                //我在这个组内
                                target.value.showBtn = true
                                target.value.btnText = "完善账单"
                                target.style.bg = "background-color: DarkCyan;"
                                return
                            }
                            if (receiptMember.isGroup && receiptMember.isMember && target.receiptStatus == 1) {
                                //我在这个组内
                                target.value.showBtn = true
                                target.value.btnText = "完善账单"
                                target.style.bg = "background-color: DarkCyan;"
                                return
                            }

                        })

                    }

                })


                if (this.data.accounts == undefined)
                    this.data.accounts = []
                this.data.accounts.appendAll(res.data.accounts)

                this.setData({
                    accounts: this.data.accounts
                })

                console.log(this.data.accounts)
                wx.stopPullDownRefresh()

                this.data.hasNextPage = res.data.hasNextPage
                this.data.nextPageIndex = res.data.hasNextPage ? res.data.pageIndex + 1 : 99999
                isLoading = false
            }

        }, this)
    }

})










