import wepy from 'wepy'
import util from '@/utils/util'
import api from '@/utils/api'

export default class ReplyMixin extends wepy.mixin {
  config = {
    enablePullDownRefresh: true,
  }
  data = {
    replies: [],
    noMoreData: false,
    isLoading: false,
    page: 1
  }
  async getReplies(reset = false) {
    try {
      let repliesResponse = await api.request({
        url: this.requestData.url,
        data: {
          page: this.page,
          include: this.requestData.include || 'user'
        }
      })
      if (repliesResponse.statusCode === 200) {
        let replies = repliesResponse.data.data
        replies.forEach(reply => {
          reply.create_at_diff = util.diffForHumans(reply.create_at)
        })
        this.replies = reset ? replies : this.replies.concat(replies)
        let pagination  = repliesResponse.data.meta.pagination
        if (pagination.current_page === pagination.total_pages) {
          this.noMoreData = true
        }
        this.$apply()
        return
      }
    } catch (error) {
      wepy.showModal({
        title: '提示',
        content: '回复获取失败'
      })
    }
  }

  async onPullDownRefresh() {
    this.page = 1
    this.noMoreData = false
    await this.getReplies(true)
    wepy.stopPullDownRefresh()
  }

  async onReachBottom() {
    if (this.noMoreData || this.isLoading) {
      return
    }
    this.isLoading = true
    this.page = this.page + 1
    await this.getReplies()
    this.isLoading = false
    this.$apply()
  }
}
