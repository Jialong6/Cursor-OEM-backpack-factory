# Cal.com 虚拟看厂预约 — 店主配置指南

网站的 `/virtual-factory-tour` 页面(12 语)内嵌 Cal.com 预约日历。
访客选时间 → 你的 Google 日历自动落日程并查冲突 → 双方收到含
Zoom / Google Meet 会议链接的确认邮件。本指南走完约 20 分钟,全程免费。

## 一、注册与基础连接

1. **注册 Cal.com 免费版**:打开 <https://cal.com/signup>,建议直接用
   Google 账号登录(选你日常排日程的那个账号,如 jay@betterbagsmm.com
   对应的 Google 账号或 jialon66@gmail.com)。
   - 注册时设置的**用户名**决定预约链接前半段(如 `better-bags`),
     后续要填进网站环境变量,起个正式点的名字。
2. **连接 Google 日历**:Settings → Calendars → Add → Google Calendar,
   授权后勾选:
   - "Check for conflicts"(查冲突):日历上已有安排的时段自动不可约;
   - "Add bookings to"(落日程):新预约自动写入该日历。
3. **连接视频会议**:Settings → Conferencing:
   - 安装 **Zoom**(用你的 Zoom 账号授权);
   - 安装 **Google Meet**(随 Google 日历一键启用)。

## 二、创建「Virtual Factory Tour」活动类型

Event Types → New:

| 配置项 | 值 |
|---|---|
| Title | Virtual Factory Tour |
| URL slug | 任意(当前实际值:`60-min-factory-tour`) |
| Duration | **60 分钟** |
| Locations | 同时勾选 **Zoom** 和 **Google Meet**,并开启"让预约者选择"(Let booker select)——中国大陆客户只能用 Zoom,Meet 在大陆不可用 |

## 三、设置可约时段(关键)

Availability → Working Hours:

1. **时区选 `Asia/Yangon` (GMT+6:30)** —— 必须先选对时区再填时间;
2. 周一至周六:**07:30 – 17:00**;周日不勾;
3. 访客打开页面时,Cal.com 会自动把这些时段换算成访客自己的时区显示,
   你不用做任何换算。

60 分钟场次的最晚开始时间会自动是 16:00(结束 17:00),Cal.com 自行处理。

## 四、防呆参数(建议值,都在 Event Type → Limits 里)

| 参数 | 建议值 | 作用 |
|---|---|---|
| Minimum notice(最短提前量) | 24 小时 | 留出备场时间,避免"5 分钟后开始"的突袭预约 |
| Buffer before / after(缓冲) | 各 15 分钟 | 两场之间留整理时间 |
| Booking window(开放窗口) | 未来 30 天 | 避免约到太远的日期 |
| Max bookings per day(每日上限) | 2 场 | 看厂一场 60 分钟,别让参观占满生产日 |

## 五、预约提问(Booking Questions)

Event Type → Advanced → Booking Questions,在默认的姓名/邮箱外新增:

1. **Company / Brand name**(公司或品牌名)— 必填,短文本;
2. **What products are you interested in? Estimated order quantity?**
   (感兴趣的产品/预计订量)— 选填,长文本。

这样开场前你就知道对方背景,可以针对性安排参观重点。

## 六、Zoom 免费版 40 分钟限制(重要)

> **警告:Zoom 免费账号所有会议限 40 分钟**,60 分钟的看厂会在
> 40 分钟处被强制断线(可重新点同一链接续开,但体验差)。

三种处理方式(任选其一):

- **升级 Zoom Pro**(约 $13-15/月)—— 最省心,大陆客户也顺畅;
- **引导非大陆客户选 Google Meet**:Meet 免费版 1 对 1 不限时,
  3 人及以上限 60 分钟(刚好卡线);
- 接受 40 分钟断线重连(不推荐,正式商务场合观感不好)。

**中国大陆客户没有选择:只能 Zoom**(Meet 被墙)。简体中文页面
不显示预约日历,而是引导通过 WhatsApp/邮件/表单预约后用 Zoom 进行,
这是网站的既定设计,无需你操作。

## 七、把预约链接接入网站

1. 在 Cal.com 打开你的活动页,链接形如:
   `https://cal.com/jayli/60-min-factory-tour`(当前实际值)
2. 取 `jayli/60-min-factory-tour` 这一段(不含域名),填入
   Vercel 环境变量:
   - Vercel → 项目 → Settings → Environment Variables
   - Name: `NEXT_PUBLIC_CAL_LINK`
   - Value: `jayli/60-min-factory-tour`
   - 环境勾选 Production(建议 Preview 也勾)
3. **Redeploy 一次**(NEXT_PUBLIC_ 变量在构建期内联,改完必须重新部署)。
4. 本地开发:在 `.env.local` 加同名变量。

未配置该变量时,预约页会显示 WhatsApp/邮件联系卡而不是空日历,
不会坏页面,但记得尽快配置。

## 八、上线验收清单

- [ ] 打开 `https://betterbagsmm.com/en/virtual-factory-tour`,日历正常加载;
- [ ] 换一个时区(手机流量/浏览器改时区)确认时段换算正确;
- [ ] 自己约一单测试:确认 Google 日历落了日程、你和"客户"邮箱都收到
      含会议链接的确认邮件;
- [ ] 确认邮件里的 Reschedule / Cancel 链接可用;
- [ ] 预约者选 Zoom 时生成的是 Zoom 链接,选 Meet 时是 Meet 链接;
- [ ] 打开 `/zh/virtual-factory-tour` 确认简中页显示替代联系卡(设计如此);
- [ ] 测试单删掉,日历还原。

## 常见问题

- **想改可约时间/时长/缓冲?** 全部在 Cal.com 后台改,即时生效,
  不用动网站代码、不用重新部署。
- **想换 Cal.com 账号或改活动 slug?** 改 Vercel 的 `NEXT_PUBLIC_CAL_LINK`
  再 Redeploy 即可。
- **预约界面是什么语言?** 跟随访客浏览器语言(支持中/日/韩/德/法等
  约 30 种,不支持缅文;缅文页面顶部有"日历可能显示为英文"的提示)。
