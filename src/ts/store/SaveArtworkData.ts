import { API } from '../API'
import { filter, FilterOption } from '../filter/Filter'
import { settings } from '../setting/Settings'
import { ArtworkData } from '../crawl/CrawlResult'
import { store } from './Store'
import { Tools } from '../Tools'

// 保存单个图片作品的数据
class SaveArtworkData {
  public async save(data: ArtworkData) {
    // 获取需要检查的信息
    const body = data.body
    const fullWidth = body.width // 原图宽度
    const fullHeight = body.height // 原图高度
    const bmk = body.bookmarkCount // 收藏数
    
    const tags: string[] = Tools.extractTags(data) // tag 列表
    let tagsWithTransl: string[] = Tools.extractTags(data,'both')  // 保存 tag 列表，附带翻译后的 tag
    let tagsTranslOnly: string[] = Tools.extractTags(data,'transl')  // 保存翻译后的 tag 列表

    const filterOpt: FilterOption = {
      createDate: body.createDate,
      id: body.id,
      workType: body.illustType,
      tags: tagsWithTransl,
      pageCount: body.pageCount,
      bookmarkCount: bmk,
      bookmarkData: body.bookmarkData,
      width: fullWidth,
      height: fullHeight,
      mini: body.urls.mini,
      userId: body.userId,
      xRestrict: body.xRestrict,
    }
    // 这里检查颜色设置是有一个隐患的：因为有些多图作品第一张图的颜色和后面的图片的颜色不一样，但这里检查时只检查第一张的缩略图。如果第一张被排除掉了，那么它后面的图片也就不会被加入抓取结果。

    // 检查通过
    if (await filter.check(filterOpt)) {
      const idNum = parseInt(body.id)
      const title = body.title // 作品标题
      const userId = body.userId // 用户id
      const user = body.userName // 用户名
      const thumb = body.urls.thumb
      const pageCount = body.pageCount
      const bookmarked = !!body.bookmarkData

      // 保存作品在排行榜上的编号
      const rankData = store.getRankList(body.id)
      const rank = rankData ? rankData : null

      const seriesTitle = body.seriesNavData ? body.seriesNavData.title : ''
      const seriesOrder = body.seriesNavData
        ? '#' + body.seriesNavData.order
        : ''

      // 储存作品信息
      if (body.illustType !== 2) {
        // 插画或漫画
        const imgUrl = body.urls.original // 作品的原图 URL

        const tempExt = imgUrl.split('.')
        const ext = tempExt[tempExt.length - 1]

        // 添加作品信息
        store.addResult({
          id: body.id,
          idNum: idNum,
          thumb: thumb,
          pageCount: pageCount,
          original: imgUrl,
          regular: body.urls.regular,
          small: body.urls.small,
          title: title,
          tags: tags,
          tagsWithTransl: tagsWithTransl,
          tagsTranslOnly: tagsTranslOnly,
          user: user,
          userId: userId,
          fullWidth: fullWidth,
          fullHeight: fullHeight,
          ext: ext,
          bmk: bmk,
          bookmarked: bookmarked,
          date: body.createDate,
          type: body.illustType,
          rank: rank,
          seriesTitle: seriesTitle,
          seriesOrder: seriesOrder,
          viewCount: body.viewCount,
          likeCount: body.likeCount,
          commentCount: body.commentCount,
          xRestrict: body.xRestrict,
          sl: body.sl,
        })
      } else if (body.illustType === 2) {
        // 动图
        // 获取动图的信息
        const meta = await API.getUgoiraMeta(body.id)
        // 动图帧延迟数据
        const ugoiraInfo = {
          frames: meta.body.frames,
          mime_type: meta.body.mime_type,
        }

        const ext = settings.ugoiraSaveAs

        store.addResult({
          id: body.id,
          idNum: idNum,
          thumb: thumb,
          pageCount: pageCount,
          original: meta.body.originalSrc,
          regular: meta.body.src,
          small: meta.body.src,
          title: title,
          tags: tags,
          tagsWithTransl: tagsWithTransl,
          tagsTranslOnly: tagsTranslOnly,
          user: user,
          userId: userId,
          fullWidth: fullWidth,
          fullHeight: fullHeight,
          ext: ext,
          bmk: bmk,
          bookmarked: bookmarked,
          date: body.createDate,
          type: body.illustType,
          rank: rank,
          ugoiraInfo: ugoiraInfo,
          seriesTitle: seriesTitle,
          seriesOrder: seriesOrder,
          viewCount: body.viewCount,
          likeCount: body.likeCount,
          commentCount: body.commentCount,
          xRestrict: body.xRestrict,
          sl: body.sl,
        })
      }
    }
  }
}

const saveArtworkData = new SaveArtworkData()
export { saveArtworkData }
