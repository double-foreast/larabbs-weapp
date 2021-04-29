import wepy from 'wepy'

export default class unreadCount extends wepy.mixin {
  data = {
    intetval: null,
    unreadCount: 0
  }
  onShow() {
    setTimeout(() => {
      this.updateUnreadCount()
    }, 1000);
    this.intetval = setInterval(() => {
      this.updateUnreadCount()
    }, 30000);
  }
  onHide() {
    clearInterval(this.intetval)
  }
  updateUnreadCount() {
    this.unreadCount = this.$parent.globalData.unreadCount
    this.$apply()
    if (this.unreadCount) {
      wepy.setTabBarBadge({
        index: 1,
        text: this.unreadCount.toString()
      })
    } else {
      wepy.removeTabBarBadge({
        index: 1
      })
    }
  }
}
