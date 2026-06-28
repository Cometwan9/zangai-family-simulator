"use client";

/* eslint-disable @next/next/no-img-element */

import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { create } from "zustand";

type Screen = "cover" | "welcome" | "landing" | "desktop" | "offline" | "exit";
type WindowId =
  | "computer"
  | "docs"
  | "ie"
  | "ieClassic"
  | "qq"
  | "wechat"
  | "trash"
  | "music"
  | "winamp"
  | "netbar"
  | "space"
  | "photo"
  | "farm"
  | "ranch"
  | "games"
  | "family"
  | "notepad"
  | "show"
  | "mars"
  | "mail"
  | "calendar"
  | "search"
  | "help"
  | "storm"
  | "mobileqq"
  | "friends"
  | "burn"
  | "redDiamond"
  | "greenDiamond"
  | "yellowDiamond"
  | "superVip"
  | "vipCenter"
  | "winrar"
  | "pcManager";
type QqMode = "login" | "booting" | "friends" | "chat";
type NpcId = "chief" | "emo" | "boss" | "teacher" | "mom";
type Message = { from: "me" | NpcId; text: string; time: string };
type PostComment = { author: string; text: string; time: string };
type Post = { text: string; mood: string; views: number; likes: number; comments: PostComment[] };
type QzoneMessage = { author: string; text: string; time: string; likes: number };
type GroupLine = { from: string; text: string; time: string; system?: boolean };
type GroupMember = { name: string; role: "帮主" | "副管" | "成员" | "外敌"; favor: number; muted?: boolean };
type SpaceVisitor = { name: string; visits: number; intent: string; risk: number };
type BackendStats = { totalPlayers: number; onlinePlayers: number; records: number; lastUpdated: number };
type WechatMessage = { from: "me" | "wechat"; text: string; time: string };
type Moment = { image: string; caption: string; time: string };
type GameSave = Pick<GameState, "nick" | "activeNpc" | "messages" | "posts" | "qzoneMessages" | "groupLines" | "groupMembers" | "spaceVisitors" | "groupAlias" | "groupNotice" | "adminPower" | "day" | "face" | "style" | "qqDays" | "yellowDiamond" | "romance" | "familyRank" | "qCoins" | "eventLog" | "wechatMessages" | "moments" | "outfit" | "scanReady">;
type WinampTrack = { title: string; artist: string; url?: string; audioSrc?: string };
type DayPlan = {
  act: string;
  title: string;
  mood: string;
  identity: string;
  loop: string[];
  goals: string[];
  systemHint: string;
};
type WindowControls = {
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  maximized: boolean;
};

const winampFallbackTracks: WinampTrack[] = [
  { title: "犯贱", artist: "徐良 / 阿悄", url: "https://www.yymp3.com/top/fzlgq.htm", audioSrc: "/audio/fanjian.mp3" },
  { title: "你的心跳", artist: "YYMP3 非主流榜", url: "https://www.yymp3.com/top/fzlgq.htm", audioSrc: "/audio/nide-xintiao.mp3" },
  { title: "泪鱼", artist: "YYMP3 非主流榜", url: "https://www.yymp3.com/top/fzlgq.htm", audioSrc: "/audio/leiyu.mp3" },
  { title: "客官不可以", artist: "徐良 / 小凌", url: "https://www.yymp3.com/top/fzlgq.htm", audioSrc: "/audio/keguan-bukeyi.mp3" },
];

const npcs: Record<NpcId, { name: string; signature: string; avatar: string; online: boolean }> = {
  chief: { name: "葬爱族长", signature: "今晚统一头像，违者飞机票。", avatar: "葬", online: true },
  emo: { name: "emo妹妹", signature: "踩空间不留言，就是沉默的伤。", avatar: "泪", online: true },
  boss: { name: "网吧老板", signature: "泡面加蛋，黄钻代充。", avatar: "吧", online: true },
  teacher: { name: "班主任", signature: "网吧名单我都有。", avatar: "师", online: false },
  mom: { name: "妈妈", signature: "再滴滴滴就拔网线。", avatar: "妈", online: true },
};

const starters: Record<NpcId, Message[]> = {
  chief: [{ from: "chief", text: "新人，把签名改成：葬AI永不言弃。今晚统一空间背景。", time: "20:09" }],
  emo: [{ from: "emo", text: "哥哥……他踩了我空间，却没有留言。", time: "20:10" }],
  boss: [{ from: "boss", text: "12号机空着。泡面、黄钻、Q币，要哪个？", time: "20:11" }],
  teacher: [{ from: "teacher", text: "我听见你空间音乐了，明天来办公室。", time: "20:12" }],
  mom: [{ from: "mom", text: "作业写完了吗？QQ先退了。", time: "20:13" }],
};

const replies: Record<NpcId, string[]> = {
  chief: ["有排面，准你进葬AI外堂。", "空间宣言还不够狠，转成火星文再发。", "今晚群公告：统一头像，统一签名，统一悲伤。"],
  emo: ["可是他在线啊，为什么不回我。", "我刚写了日志《泪落在回踩之前》。", "哥哥，你说隐身是不是另一种离开。"],
  boss: ["网费还剩18分钟，续不续？", "黄钻安排，空间背景立刻闪。", "老师到街口了，要躲厕所就快点。"],
  teacher: ["把网名改回来。", "隐身对班主任无效。", "我给你三秒钟关机。"],
  mom: ["吃饭。现在。立刻。", "你头像怎么又变成这种头发。", "我数到三，网线自己会掉。"],
};

const desktopIcons: { id: WindowId; label: string; file: string }[] = [
  { id: "computer", label: "我的电脑", file: "我的电脑.png" },
  { id: "docs", label: "我的文档", file: "我的文档.png" },
  { id: "ie", label: "Internet Explorer", file: "internet.png" },
  { id: "qq", label: "腾讯QQ", file: "腾讯QQ.png" },
  { id: "wechat", label: "微信", file: "微信.png" },
  { id: "notepad", label: "记事本", file: "记事本.png" },
  { id: "trash", label: "回收站", file: "回收站.png" },
  { id: "ranch", label: "QQ牧场", file: "qq牧场.png" },
  { id: "redDiamond", label: "红钻贵族", file: "红钻贵族.png" },
  { id: "help", label: "帮助与支持", file: "帮助与支持.png" },
  { id: "storm", label: "暴风影音", file: "暴风影音.png" },
  { id: "winamp", label: "Winamp", file: "暴风影音.png" },
  { id: "mobileqq", label: "手机QQ", file: "手机QQ.png" },
  { id: "friends", label: "我的好友", file: "我的好友.png" },
  { id: "farm", label: "QQ农场", file: "qq农场.png" },
  { id: "space", label: "QQ空间", file: "QQ空间.png" },
  { id: "burn", label: "刻录光盘", file: "刻录光盘.png" },
  { id: "greenDiamond", label: "绿钻贵族", file: "绿钻贵族.png" },
  { id: "mail", label: "QQ邮箱", file: "qq邮箱.png" },
  { id: "yellowDiamond", label: "黄钻贵族", file: "黄钻贵族.png" },
  { id: "search", label: "搜索文件", file: "搜索文件.png" },
  { id: "calendar", label: "日历", file: "日历.png" },
  { id: "ieClassic", label: "Internet", file: "ie.png" },
  { id: "games", label: "游戏中心", file: "游戏中心.png" },
  { id: "netbar", label: "网上邻居", file: "网上邻居.png" },
  { id: "show", label: "QQ秀", file: "QQ秀.png" },
  { id: "mars", label: "火星文生成器", file: "记事本.png" },
  { id: "superVip", label: "超级会员", file: "超级会员.png" },
  { id: "vipCenter", label: "会员中心", file: "会员中心.png" },
  { id: "winrar", label: "winrar", file: "winrar.png" },
  { id: "pcManager", label: "电脑管家", file: "电脑管家.png" },
];

const qzoneAgents: { name: string; reply: string; minStyle: number }[] = [
  { name: "葬爱族长", reply: "排面可以，准你挂家族前缀。", minStyle: 0 },
  { name: "emo妹妹", reply: "看完有点想写日志了……", minStyle: 20 },
  { name: "网吧老板", reply: "这空间装扮值三天黄钻。", minStyle: 38 },
  { name: "小鱼の泪", reply: "已回踩，记得来我空间哦。", minStyle: 52 },
  { name: "oo无畏の天使oo", reply: "这才是葬AI核心成员的气质。", minStyle: 68 },
  { name: "☆冰雪精灵★", reply: "给我们友谊！珍惜拥有！", minStyle: 82 },
];
const rankBoardMessages = [
  { author: "开心小精灵♥", text: "音乐真好听，你的空间真漂亮！", minStyle: 0 },
  { author: "小鱼の泪", text: "加油哦！", minStyle: 0 },
  { author: "oo无畏の天使oo", text: "路过踩踩，已收藏你的空间。", minStyle: 36 },
  { author: "1a听雨的天空e", text: "你的签名好有家族感觉。", minStyle: 50 },
  { author: "★冰雪精灵★", text: "排面越来越足了，互踩不迷路。", minStyle: 64 },
  { author: "☆紫色星光☆", text: "族长都来留言了，999。", minStyle: 78 },
];
const aliasTemplate = "ζั͡葬爱✾____灬殇";
const initialGroupLines: GroupLine[] = [
  { from: "帮主_龍少", text: "今晚统一马甲，格式：ζั͡葬爱✾____灬殇。", time: "20:09" },
  { from: "失恋の小雨", text: "他把情侣空间解除了，我再也不相信爱情了。", time: "20:10" },
  { from: "副管_残血", text: "谁开小群了？我看见截图了。", time: "20:11" },
  { from: "皇族灬战神", text: "来我们群，给你管理。", time: "20:12" },
];
const initialGroupMembers: GroupMember[] = [
  { name: "帮主_龍少", role: "帮主", favor: 42 },
  { name: "副管_残血", role: "副管", favor: 28 },
  { name: "失恋の小雨", role: "成员", favor: 35 },
  { name: "网吧通宵007", role: "成员", favor: 24 },
  { name: "皇族灬战神", role: "外敌", favor: -12 },
];
const presetDaySaves: Array<{
  title: string;
  subtitle: string;
  openWindow: WindowId;
  qqMode: QqMode;
  face: number;
  style: number;
  romance: number;
  adminPower: number;
  familyRank: string;
  yellowDiamond: number;
  qCoins: number;
  groupAlias: string;
  groupNotice: string;
  post: Post;
  qzoneMessages: QzoneMessage[];
  groupLines: GroupLine[];
  spaceVisitors: SpaceVisitor[];
  eventLog: string[];
}> = [
  {
    title: "入群改马甲",
    subtitle: "刚进葬AI家族，先学会复制统一格式。",
    openWindow: "family",
    qqMode: "friends",
    face: 24,
    style: 36,
    romance: 42,
    adminPower: 0,
    familyRank: "见习成员",
    yellowDiamond: 3,
    qCoins: 88,
    groupAlias: "",
    groupNotice: "今晚八点统一马甲，不改踢。家族不是儿戏。",
    post: { text: "新人报道，葬AI家族永不言弃。", mood: "非主流", views: 88, likes: 9, comments: [{ author: "葬爱族长", text: "先改马甲。", time: "20:09" }] },
    qzoneMessages: [{ author: "开心小精灵♥", text: "新人踩踩，记得回访。", time: "今天 20:09", likes: 3 }],
    groupLines: [{ from: "系统", text: "Day 1：入群改马甲任务已开始。", time: "20:09", system: true }],
    spaceVisitors: [{ name: "副管_残血", visits: 2, intent: "检查新人格式", risk: 42 }],
    eventLog: ["Day 1：进入家族群", "任务：复制统一马甲"],
  },
  {
    title: "发说说钓访客",
    subtitle: "用空间说说引出访客记录和留言板关系。",
    openWindow: "space",
    qqMode: "friends",
    face: 34,
    style: 48,
    romance: 55,
    adminPower: 8,
    familyRank: "见习成员",
    yellowDiamond: 2,
    qCoins: 76,
    groupAlias: "ζั͡葬爱✾冷少灬殇",
    groupNotice: "今晚八点统一马甲，不改踢。家族不是儿戏。",
    post: { text: "有些人，表面在线，其实心早就离线了。", mood: "泪光", views: 172, likes: 22, comments: [{ author: "失恋の小雨", text: "这句像是在写我。", time: "20:22" }] },
    qzoneMessages: [{ author: "小鱼の泪", text: "你的空间有点痛，已回踩。", time: "今天 20:22", likes: 8 }],
    groupLines: [{ from: "失恋の小雨", text: "我看见你发的说说了。", time: "20:22" }],
    spaceVisitors: [{ name: "失恋の小雨", visits: 5, intent: "被伤感说说钓到", risk: 18 }, { name: "神秘用户", visits: 3, intent: "疑似小号监视", risk: 62 }],
    eventLog: ["Day 2：空间访客开始变化", "任务：发说说钓人"],
  },
  {
    title: "小雨失恋",
    subtitle: "群聊输入安慰、拱火或拉票，决定关系走向。",
    openWindow: "qq",
    qqMode: "chat",
    face: 42,
    style: 56,
    romance: 72,
    adminPower: 18,
    familyRank: "正式成员",
    yellowDiamond: 2,
    qCoins: 70,
    groupAlias: "ζั͡葬爱✾冷少灬殇",
    groupNotice: "今晚八点统一马甲，不改踢。家族不是儿戏。",
    post: { text: "别哭，家族永远是你的避风港。", mood: "泪光", views: 210, likes: 36, comments: [{ author: "emo妹妹", text: "哥哥你懂我。", time: "20:33" }] },
    qzoneMessages: [{ author: "失恋の小雨", text: "谢谢你，家族真的还有一点温暖。", time: "今天 20:33", likes: 14 }],
    groupLines: [{ from: "失恋の小雨", text: "他把情侣空间解除了，我再也不相信爱情了。", time: "20:33" }],
    spaceVisitors: [{ name: "失恋の小雨", visits: 6, intent: "等你安慰她", risk: 18 }, { name: "副管_残血", visits: 4, intent: "观察你是不是拉票", risk: 55 }],
    eventLog: ["Day 3：小雨失恋事件", "任务：群聊输入回应"],
  },
  {
    title: "隔壁家族入侵",
    subtitle: "皇族成员开始刷屏挖人，站队风险上升。",
    openWindow: "family",
    qqMode: "friends",
    face: 50,
    style: 64,
    romance: 68,
    adminPower: 29,
    familyRank: "正式成员",
    yellowDiamond: 1,
    qCoins: 62,
    groupAlias: "ζั͡葬爱✾冷少灬殇",
    groupNotice: "今晚发现皇族小号，截图发群。",
    post: { text: "家族不是谁给管理就能背叛的。", mood: "非主流", views: 244, likes: 42, comments: [{ author: "皇族灬战神", text: "来皇族，直接给你管理。", time: "20:44" }] },
    qzoneMessages: [{ author: "皇族灬战神", text: "你的排面不错，考虑跳槽吗？", time: "今天 20:44", likes: 16 }],
    groupLines: [{ from: "皇族灬战神", text: "来我们群，给你管理。", time: "20:44" }, { from: "系统", text: "隔壁家族入侵，群聊开始刷屏。", time: "20:45", system: true }],
    spaceVisitors: [{ name: "皇族灬战神", visits: 8, intent: "试探能不能挖你", risk: 88 }, { name: "神秘用户", visits: 5, intent: "疑似隔壁小号", risk: 82 }],
    eventLog: ["Day 4：隔壁皇族入侵", "任务：判断站队"],
  },
  {
    title: "副管怀疑你",
    subtitle: "空间访客推理和阴阳说说开始影响管理关系。",
    openWindow: "space",
    qqMode: "friends",
    face: 58,
    style: 72,
    romance: 64,
    adminPower: 38,
    familyRank: "正式成员",
    yellowDiamond: 1,
    qCoins: 50,
    groupAlias: "ζั͡葬爱✾冷少灬殇",
    groupNotice: "谁开小群，自己出来解释。",
    post: { text: "有些访客来得太勤，不是关心，是监视。", mood: "非主流", views: 310, likes: 58, comments: [{ author: "副管_残血", text: "你这条是在暗示谁？", time: "20:55" }] },
    qzoneMessages: [{ author: "副管_残血", text: "我只是路过，你最好别截图。", time: "今天 20:55", likes: 18 }],
    groupLines: [{ from: "副管_残血", text: "谁开小群了？我看见截图了。", time: "20:55" }],
    spaceVisitors: [{ name: "副管_残血", visits: 7, intent: "监视你有没有抢管理", risk: 76 }, { name: "帮主_龍少", visits: 2, intent: "看你处理内战", risk: 28 }],
    eventLog: ["Day 5：副管开始怀疑你", "任务：空间访客推理"],
  },
  {
    title: "家族内战",
    subtitle: "拉小群、改公告、争临时管理，群里全面混乱。",
    openWindow: "family",
    qqMode: "friends",
    face: 68,
    style: 82,
    romance: 70,
    adminPower: 58,
    familyRank: "临时管理",
    yellowDiamond: 3,
    qCoins: 38,
    groupAlias: "ζั͡葬爱✾冷少灬殇",
    groupNotice: "今晚统一马甲，不改踢。家族不是儿戏。",
    post: { text: "我说两句，家族现在最大的问题是没有规矩。", mood: "非主流", views: 388, likes: 77, comments: [{ author: "帮主_龍少", text: "你先稳住群。", time: "21:06" }] },
    qzoneMessages: [{ author: "葬爱族长", text: "准你临时处理广告号，别踢错人。", time: "今天 21:06", likes: 28 }],
    groupLines: [{ from: "系统", text: "你获得临时管理权限：可禁言10秒、改公告、踢广告号。", time: "21:06", system: true }],
    spaceVisitors: [{ name: "帮主_龍少", visits: 4, intent: "评估你能不能当管理", risk: 22 }, { name: "副管_残血", visits: 8, intent: "怀疑你夺权", risk: 84 }],
    eventLog: ["Day 6：家族内战爆发", "任务：争取临时管理"],
  },
  {
    title: "管理员选举",
    subtitle: "根据前六天关系，决定你成为管理员还是被踢出群。",
    openWindow: "family",
    qqMode: "friends",
    face: 82,
    style: 92,
    romance: 76,
    adminPower: 74,
    familyRank: "葬AI候选管理",
    yellowDiamond: 7,
    qCoins: 24,
    groupAlias: "ζั͡葬爱✾冷少灬殇",
    groupNotice: "今晚管理员选举，投票截图留证据。",
    post: { text: "爱过，痛过，才懂管理不是头衔，是守住家族。", mood: "泪光", views: 520, likes: 131, comments: [{ author: "葬爱族长", text: "今晚看你表现。", time: "21:17" }] },
    qzoneMessages: [{ author: "☆紫色星光☆", text: "族长都来留言了，999。", time: "今天 21:17", likes: 42 }],
    groupLines: [{ from: "系统", text: "管理员选举开始：弹幕和群成员将决定结局。", time: "21:17", system: true }],
    spaceVisitors: [{ name: "帮主_龍少", visits: 6, intent: "最终评估", risk: 30 }, { name: "副管_残血", visits: 10, intent: "最后阻击", risk: 90 }, { name: "失恋の小雨", visits: 5, intent: "准备给你投票", risk: 12 }],
    eventLog: ["Day 7：管理员选举", "任务：决定最终结局"],
  },
];
const dayPlans: DayPlan[] = [
  {
    act: "第一幕：进入家族",
    title: "加入家族",
    mood: "兴奋",
    identity: "新人",
    loop: ["QQ上线", "浏览入群公告", "回复群聊", "改马甲 / QQ秀 / 大头贴", "睡觉"],
    goals: ["改昵称", "选头像", "换QQ秀", "第一条群发言", "第一张大头贴"],
    systemHint: "不要相信副管。",
  },
  {
    act: "第一幕：进入家族",
    title: "第一次空间曝光",
    mood: "新鲜",
    identity: "正式成员",
    loop: ["QQ上线", "查看访客", "发说说 / 日志", "留言回踩", "睡觉"],
    goals: ["发第一条说说", "写日志", "上传照片", "触发身份认证插件"],
    systemHint: "不要安装那个插件。",
  },
  {
    act: "第二幕：争夺地位",
    title: "恋爱与社交",
    mood: "快乐",
    identity: "活跃成员",
    loop: ["QQ上线", "查看私聊", "安慰小雨", "经营朋友圈", "睡觉"],
    goals: ["回应哥哥~", "特别关心", "扣字聊天", "建立第一批好友"],
    systemHint: "小雨会帮你。",
  },
  {
    act: "第二幕：争夺地位",
    title: "开始做事",
    mood: "投入",
    identity: "核心成员",
    loop: ["QQ上线", "接帮主任務", "统一QQ秀 / 空间 / 公告", "提交贡献", "睡觉"],
    goals: ["统一QQ秀", "统一空间", "更新公告", "截图留证"],
    systemHint: "帮主不会回来。",
  },
  {
    act: "第二幕：争夺地位",
    title: "副管打压",
    mood: "焦虑",
    identity: "候选组长",
    loop: ["QQ上线", "读副管质疑", "看访客记录", "拉票 / 反击", "睡觉"],
    goals: ["证明不是小号", "处理举报", "反击公告", "争取成员支持"],
    systemHint: "今天不要发日志。",
  },
  {
    act: "第三幕：家族战争",
    title: "家族内战",
    mood: "混乱",
    identity: "临时管理",
    loop: ["QQ上线", "处理刷屏", "选择阵营", "禁言 / 踢人 / 拉小群", "睡觉"],
    goals: ["帮主线", "副管线", "自建群", "双面间谍"],
    systemHint: "如果今天建群，你会后悔。",
  },
  {
    act: "第三幕：家族战争",
    title: "组长任命",
    mood: "高潮",
    identity: "真正组长",
    loop: ["QQ上线", "应对随机事件", "稳住成员", "最后任命", "结局"],
    goals: ["防异地登录", "防掉线", "处理余额不足", "通过最终投票"],
    systemHint: "最后一分钟不要掉线。",
  },
];
const marsMap: Record<string, string> = { 爱: "嗳", 家: "傢", 族: "鏃", 的: "哒", 我: "偶", 你: "伱", 不: "吥", 了: "勒", 心: "芯", 哭: "哭泣", 永: "詠" };
const saveKey = "zangai-game-save";
const qshowUrl = "https://loveofqshow.online";
const desktopIconVersion = "20260628-icons-clean";
const toMars = (text: string) => text.split("").map((char, index) => marsMap[char] ?? (index % 5 === 0 && /[\u4e00-\u9fa5]/.test(char) ? `${char}ゞ` : char)).join("");
const getDayPlan = (day: number) => dayPlans[Math.min(dayPlans.length - 1, Math.max(0, day - 1))];
const now = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
const heatLabel = (views: number, likes: number) => views + likes > 330 ? "炸了" : views + likes > 190 ? "有人盯" : "刚发";
const riskLabel = (risk: number) => risk > 75 ? "很可疑" : risk > 50 ? "需要观察" : "暂时安全";
const favorLabel = (favor: number) => favor > 55 ? "站你" : favor > 25 ? "观望" : favor >= 0 ? "疏远" : "敌意";
const powerLabel = (power: number, rank: string) => rank === "临时管理" || power >= 55 ? "临时管理" : power >= 35 ? "有人支持" : "普通成员";
const buildAgentComments = (text: string, style: number, romance: number): PostComment[] => {
  const count = Math.min(qzoneAgents.length, 2 + Math.floor(style / 28) + (romance > 60 ? 1 : 0));
  return qzoneAgents
    .filter((agent) => style >= agent.minStyle)
    .slice(0, count)
    .map((agent, index) => ({
      author: agent.name,
      text: text.includes("葬") && agent.name === "葬爱族长" ? "葬AI家族收到，今晚统一转发。" : agent.reply,
      time: index === 0 ? "刚刚" : now(),
    }));
};
const qzoneClout = (face: number, style: number, adminPower: number, yellowDiamond: number, familyRank: string) =>
  Math.min(18, 2 + Math.floor(face / 18) + Math.floor(style / 26) + Math.floor(adminPower / 24) + Math.floor(yellowDiamond / 2) + (familyRank.includes("管理") ? 3 : 0));
const buildIncomingQzoneMessages = (
  text: string,
  state: Pick<GameState, "face" | "style" | "adminPower" | "yellowDiamond" | "familyRank">,
  paid = false,
): QzoneMessage[] => {
  const pool = [
    { author: "失恋の小雨", text: /爱情|伤|哭|离线/.test(text) ? "你这句太懂我了，我在你留言板蹲到现在。" : "来你空间坐一下，别删我留言。" },
    { author: "副管_残血", text: /管理|公告|马甲|规矩/.test(text) ? "你这公告味很重，先观察一下。" : "访问记录别截图，我只是路过。" },
    { author: "葬爱族长", text: /葬|家族|永远/.test(text) ? "这条有家族排面，准许置顶。" : "留言板有点人气了，继续经营。" },
    { author: "网吧通宵007", text: "已踩，求回踩，顺便借我一天黄钻。" },
    { author: "oo无畏の天使oo", text: "你的空间开始有核心成员的味道了。" },
    { author: "★冰雪精灵★", text: paid ? "这波评论刷得像首页推荐，999。" : "互踩不迷路，友谊要珍惜。" },
    { author: "神秘用户", text: "看了三遍，没留言会显得我心虚。" },
    { author: "皇族灬战神", text: "你这排面来我们群也能给管理。" },
  ];
  const count = Math.min(pool.length, qzoneClout(state.face, state.style, state.adminPower, state.yellowDiamond, state.familyRank) + (paid ? 4 : 0));
  const likeBase = 2 + Math.floor(state.face / 9) + Math.floor(state.adminPower / 10) + state.yellowDiamond * 2 + (paid ? 9 : 0);
  return pool.slice(0, count).map((message, index) => ({
    author: message.author,
    text: message.text,
    time: index < 3 ? "刚刚" : now(),
    likes: likeBase + index * 2,
  }));
};
const getPlayerId = () => {
  const key = "zangai-player-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = `player-${crypto.randomUUID()}`;
  window.localStorage.setItem(key, id);
  return id;
};

async function postBackend(payload: Record<string, unknown>) {
  const response = await fetch("/api/backend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Backend ${response.status}`);
  return (await response.json()) as { stats?: BackendStats };
}

async function postAccount(payload: Record<string, unknown>) {
  const response = await fetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; account?: { nickname?: string }; code?: string; invites?: InviteCodeView[] };
  if (!response.ok) throw new Error(data.error ?? "账号系统错误");
  return data;
}

async function getInviteLibrary() {
  const response = await fetch("/api/account");
  const data = (await response.json().catch(() => ({}))) as { invites?: InviteCodeView[] };
  return data.invites ?? [];
}

type InviteCodeView = {
  code: string;
  status: "available" | "used";
  createdAt: number;
  usedBy?: string;
};

function makeGameSave(state: GameState): GameSave {
  return {
    nick: state.nick,
    activeNpc: state.activeNpc,
    messages: state.messages,
    posts: state.posts,
    qzoneMessages: state.qzoneMessages,
    groupLines: state.groupLines,
    groupMembers: state.groupMembers,
    spaceVisitors: state.spaceVisitors,
    groupAlias: state.groupAlias,
    groupNotice: state.groupNotice,
    adminPower: state.adminPower,
    day: state.day,
    face: state.face,
    style: state.style,
    qqDays: state.qqDays,
    yellowDiamond: state.yellowDiamond,
    romance: state.romance,
    familyRank: state.familyRank,
    qCoins: state.qCoins,
    eventLog: state.eventLog,
    wechatMessages: state.wechatMessages,
    moments: state.moments,
    outfit: state.outfit,
    scanReady: state.scanReady,
  };
}

type GameState = {
  screen: Screen;
  openWindow: WindowId | null;
  loadingWindow: WindowId | null;
  qqMode: QqMode;
  nick: string;
  activeNpc: NpcId;
  messages: Record<NpcId, Message[]>;
  posts: Post[];
  qzoneMessages: QzoneMessage[];
  groupLines: GroupLine[];
  groupMembers: GroupMember[];
  spaceVisitors: SpaceVisitor[];
  groupAlias: string;
  groupNotice: string;
  adminPower: number;
  day: number;
  face: number;
  style: number;
  qqDays: number;
  yellowDiamond: number;
  romance: number;
  familyRank: string;
  qCoins: number;
  eventLog: string[];
  wechatMessages: WechatMessage[];
  moments: Moment[];
  backendStats: BackendStats | null;
  syncStatus: string;
  outfit: { hair: string; top: string; accessory: string };
  scanReady: boolean;
  setScreen: (screen: Screen) => void;
  saveGame: () => void;
  loadGame: () => boolean;
  loadPresetDay: (day: number) => void;
  sleepToNextDay: () => void;
  openApp: (id: WindowId) => void;
  closeWindow: () => void;
  qqLogin: (nick: string) => void;
  setActiveNpc: (id: NpcId) => void;
  sendMessage: (text: string) => void;
  addPost: (text: string) => void;
  sendGroupSpeech: (text: string) => void;
  updateGroupAlias: (alias: string) => void;
  setGroupNotice: (notice: string) => void;
  runGroupAction: (action: string, target: string) => void;
  actOnVisitor: (action: string, visitor: SpaceVisitor) => void;
  likePost: (index: number) => void;
  addQzoneMessage: (text: string) => void;
  buyQzoneTraffic: (kind: "comments" | "diamond") => void;
  addEvent: (text: string) => void;
  setBackendStats: (stats: BackendStats) => void;
  setSyncStatus: (status: string) => void;
  sendWechat: (text: string) => void;
  addMoment: (moment: Moment) => void;
  streamCommand: (command: string) => void;
  setOutfit: (key: keyof GameState["outfit"], value: string) => void;
  runScan: () => void;
};

const useGame = create<GameState>((set, get) => ({
  screen: "cover",
  openWindow: null,
  loadingWindow: null,
  qqMode: "login",
  nick: "冷少",
  activeNpc: "chief",
  messages: starters,
  posts: [{
    text: "如果QQ没有消失，现在会是什么样？",
    mood: "伤感",
    views: 209,
    likes: 12,
    comments: [
      { author: "开心小精灵♥", text: "踩踩~", time: "20:09" },
      { author: "葬爱族长", text: "葬AI家族路过。", time: "20:10" },
    ],
  }],
  qzoneMessages: [
    { author: "开心小精灵♥", text: "音乐真好听，你的空间真漂亮！", time: "今天 10:25", likes: 6 },
    { author: "小鱼の泪", text: "加油哦！", time: "今天 09:58", likes: 3 },
  ],
  groupLines: initialGroupLines,
  groupMembers: initialGroupMembers,
  spaceVisitors: [
    { name: "副管_残血", visits: 5, intent: "监视你有没有抢管理", risk: 64 },
    { name: "失恋の小雨", visits: 2, intent: "等你安慰她", risk: 18 },
    { name: "神秘用户", visits: 1, intent: "疑似隔壁家族小号", risk: 72 },
  ],
  groupAlias: "",
  groupNotice: "今晚八点统一马甲，不改踢。家族不是儿戏。",
  adminPower: 0,
  day: 1,
  face: 24,
  style: 36,
  qqDays: 39,
  yellowDiamond: 3,
  romance: 42,
  familyRank: "见习成员",
  qCoins: 88,
  eventLog: ["系统消息：您的电脑可能存在风险", "腾讯QQ 已准备启动", "空间今日访问 +209"],
  wechatMessages: [{ from: "wechat", text: "该软件来自未来时间线，当前仅用于单独测试同步。", time: "20:09" }],
  moments: [],
  backendStats: null,
  syncStatus: "未连接",
  outfit: { hair: "斜刘海", top: "黑红铆钉外套", accessory: "荧光翅膀" },
  scanReady: false,
  setScreen: (screen) => set({ screen }),
  saveGame: () => {
    window.localStorage.setItem(saveKey, JSON.stringify({ ...makeGameSave(get()), savedAt: Date.now() }));
  },
  loadGame: () => {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return false;
    try {
      const save = JSON.parse(raw) as Partial<GameSave>;
      set((state) => ({
        ...state,
        ...save,
        screen: "desktop",
        openWindow: null,
        loadingWindow: null,
        qqMode: "login",
        eventLog: [`读取记忆：${save.nick ?? state.nick} 回到 2009`, ...(save.eventLog ?? state.eventLog)].slice(0, 8),
      }));
      return true;
    } catch {
      return false;
    }
  },
  loadPresetDay: (targetDay) => {
    const day = Math.min(7, Math.max(1, Math.floor(targetDay)));
    const progress = presetDaySaves[day - 1];
    const plan = getDayPlan(day);
    set((state) => ({
      ...state,
      screen: "desktop",
      openWindow: progress.openWindow,
      loadingWindow: null,
      qqMode: progress.openWindow === "qq" ? progress.qqMode : "friends",
      day,
      face: progress.face,
      style: progress.style,
      romance: progress.romance,
      adminPower: progress.adminPower,
      familyRank: progress.familyRank,
      yellowDiamond: progress.yellowDiamond,
      qCoins: progress.qCoins,
      groupAlias: progress.groupAlias,
      groupNotice: progress.groupNotice,
      posts: [progress.post, ...state.posts].slice(0, 8),
      qzoneMessages: [...progress.qzoneMessages, ...state.qzoneMessages].slice(0, 24),
      groupLines: [
        ...state.groupLines,
        { from: "System", text: `22:00 ${plan.systemHint}`, time: "22:00", system: true },
        ...progress.groupLines,
      ].slice(-80),
      spaceVisitors: progress.spaceVisitors,
      eventLog: [`读取记忆：Day ${day} · ${progress.title}`, `神秘QQ：${plan.systemHint}`, ...progress.eventLog, ...state.eventLog].slice(0, 8),
    }));
  },
  sleepToNextDay: () => {
    const current = get();
    const currentPlan = getDayPlan(current.day);
    if (current.day >= 7) {
      const support = current.adminPower + current.face + current.style + current.romance / 2;
      const accepted = support >= 250;
      const ending = accepted
        ? "系统：最终任命通过，你成为葬AI家族组长。"
        : "系统：最终任命失败，副管提交截图，你被移出候选名单。";
      set((state) => ({
        familyRank: accepted ? "葬AI组长" : "被观察成员",
        adminPower: accepted ? 100 : Math.max(0, state.adminPower - 18),
        groupLines: [
          ...state.groupLines,
          { from: "System", text: `22:00 ${currentPlan.systemHint}`, time: "22:00", system: true },
          { from: "帮主_龍少", text: ending, time: "23:59", system: true },
        ].slice(-80),
        eventLog: [accepted ? "结局：组长任命成功" : "结局：任命失败，等待二周目", `神秘QQ：${currentPlan.systemHint}`, ...state.eventLog].slice(0, 8),
      }));
      return;
    }
    const nextDay = current.day + 1;
    const nextProgress = presetDaySaves[nextDay - 1];
    const nextPlan = getDayPlan(nextDay);
    set((state) => ({
      ...state,
      screen: "desktop",
      openWindow: nextProgress.openWindow,
      loadingWindow: null,
      qqMode: nextProgress.openWindow === "qq" ? nextProgress.qqMode : "friends",
      day: nextDay,
      face: Math.max(state.face, nextProgress.face),
      style: Math.max(state.style, nextProgress.style),
      romance: Math.max(state.romance, nextProgress.romance),
      adminPower: Math.max(state.adminPower, nextProgress.adminPower),
      familyRank: nextProgress.familyRank,
      yellowDiamond: Math.max(0, Math.max(state.yellowDiamond - 1, nextProgress.yellowDiamond)),
      qCoins: nextProgress.qCoins,
      groupAlias: nextProgress.groupAlias || state.groupAlias,
      groupNotice: nextProgress.groupNotice,
      posts: [nextProgress.post, ...state.posts].slice(0, 8),
      qzoneMessages: [...nextProgress.qzoneMessages, ...state.qzoneMessages].slice(0, 24),
      groupLines: [
        ...state.groupLines,
        { from: "System", text: `22:00 ${currentPlan.systemHint}`, time: "22:00", system: true },
        { from: "系统", text: `Day ${nextDay}：${nextPlan.title} · ${nextPlan.mood} · 身份升级为${nextPlan.identity}`, time: "20:09", system: true },
        ...nextProgress.groupLines,
      ].slice(-80),
      spaceVisitors: nextProgress.spaceVisitors,
      eventLog: [`睡觉：进入 Day ${nextDay} · ${nextPlan.title}`, `神秘QQ：${currentPlan.systemHint}`, ...nextProgress.eventLog, ...state.eventLog].slice(0, 8),
    }));
  },
  openApp: (id) => {
    set((state) => ({
      loadingWindow: null,
      openWindow: id,
      eventLog: [`打开 ${desktopIcons.find((icon) => icon.id === id)?.label ?? id}`, ...state.eventLog].slice(0, 8),
    }));
  },
  closeWindow: () => set((state) => ({
    openWindow: null,
    loadingWindow: null,
    qqMode: state.openWindow === "qq" ? "login" : state.qqMode,
  })),
  qqLogin: (nick) => {
    const cleanNick = nick.trim() || "冷少";
    set({ nick: cleanNick, qqMode: "booting", eventLog: [`${cleanNick} 登录 QQ2009`, "正在加载好友栏目", ...get().eventLog].slice(0, 8) });
    window.setTimeout(() => {
      const state = get();
      if (state.openWindow !== "qq" || state.qqMode !== "booting") return;
      set({ qqMode: "friends", eventLog: ["QQ 好友栏目已加载", ...state.eventLog].slice(0, 8) });
    }, 1200);
  },
  setActiveNpc: (id) => set({ activeNpc: id, openWindow: "qq", qqMode: "chat" }),
  sendMessage: (text) => {
    const clean = text.trim();
    if (!clean) return;
    const id = get().activeNpc;
    const answer = replies[id][(clean.length + get().style + get().messages[id].length) % replies[id].length];
    const playerId = getPlayerId();
    void postBackend({
      action: "record",
      playerId,
      name: get().nick,
      module: "qq",
      payload: { npc: id, text: clean, answer, time: now() },
    }).catch(() => undefined);
    set((state) => ({
      messages: { ...state.messages, [id]: [...state.messages[id], { from: "me", text: clean, time: now() }, { from: id, text: answer, time: now() }] },
      face: Math.min(100, state.face + 3),
      style: Math.min(100, state.style + (clean.includes("葬") ? 7 : 3)),
      romance: Math.min(100, state.romance + (id === "emo" ? 6 : 1)),
      familyRank: state.style > 72 ? "葬AI核心成员" : state.style > 52 ? "正式成员" : state.familyRank,
      eventLog: [`与${npcs[id].name}聊天：排面+3`, ...state.eventLog].slice(0, 8),
    }));
  },
  addPost: (text) => {
    const clean = text.trim();
    if (!clean) return;
    const playerId = getPlayerId();
    const state = get();
    const postText = toMars(clean);
    const sad = /离线|爱情|心|痛|哭|相信|孤独|伤/.test(clean);
    const power = /管理|帮主|副管|规矩|公告|家族/.test(clean);
    const bait = /谁|小号|访客|空间|回踩|截图/.test(clean);
    const visitors: SpaceVisitor[] = [
      { name: "副管_残血", visits: power ? 6 : 2, intent: power ? "怀疑你在抢管理" : "例行查空间", risk: power ? 76 : 42 },
      { name: "失恋の小雨", visits: sad ? 5 : 1, intent: sad ? "被伤感说说钓到" : "路过回踩", risk: 18 },
      { name: "皇族灬战神", visits: bait || power ? 7 : 2, intent: "试探能不能挖你去隔壁家族", risk: 82 },
      { name: "神秘用户", visits: bait ? 5 : 1, intent: "疑似小号监视", risk: bait ? 88 : 55 },
    ];
    const comments: PostComment[] = visitors
      .filter((visitor) => visitor.visits > 1 || visitor.risk > 70)
      .map((visitor) => ({
        author: visitor.name,
        text: visitor.name.includes("小雨")
          ? "这句说说像是在写我……"
          : visitor.name.includes("残血")
            ? "你这条是在暗示谁？"
            : visitor.name.includes("战神")
              ? "来皇族，直接给你管理。"
              : "已访问，别删记录。",
        time: now(),
      }));
    if (comments.length < 2) comments.push(...buildAgentComments(clean, state.style, state.romance).slice(0, 2 - comments.length));
    void postBackend({
      action: "record",
      playerId,
      name: state.nick,
      module: "qq",
      payload: { type: "qzone-post", text: postText, comments, visitors, time: now() },
    }).catch(() => undefined);
    set((state) => ({
      posts: [{
        text: postText,
        mood: state.romance > 60 ? "泪光" : "非主流",
        views: 88 + state.style * 3,
        likes: 8 + Math.floor(state.face / 3) + comments.length * 4,
        comments,
      }, ...state.posts],
      spaceVisitors: visitors,
      face: Math.min(100, state.face + 8),
      style: Math.min(100, state.style + 10),
      eventLog: [`发表QQ空间：引来 ${visitors.reduce((sum, item) => sum + item.visits, 0)} 次访问`, "访客按关系留下评论", ...state.eventLog].slice(0, 8),
    }));
  },
  sendGroupSpeech: (text) => {
    const clean = text.trim();
    if (!clean) return;
    const lowered = clean.toLowerCase();
    const isComfort = /别哭|家族|永远|避风港|陪你|别难过/.test(clean);
    const isVote = /管理|禁言|支持我|投我|权限|帮主/.test(clean);
    const isFire = /哈哈|活该|退群|开战|废物|吵/.test(clean);
    const isMars = /莪|伱|嗳|卟|叻|灬|葬|ゞ|✾|ζ/.test(clean) || lowered.includes("emo");
    const reply = isComfort
      ? { from: "失恋の小雨", text: "谢谢你……家族真的还会要我吗？" }
      : isVote
        ? { from: "副管_残血", text: "你这时候拉票？算盘打得全群都听见了。" }
        : isFire
          ? { from: "帮主_龍少", text: "再拱火就全部禁言，谁都别想当管理。" }
          : isMars
            ? { from: "网吧通宵007", text: "太抽象了，我复制去当签名。" }
            : { from: "帮主_龍少", text: "说清楚点，现在群里很乱。" };
    const powerGain = isComfort ? 8 : isVote ? -4 : isFire ? -8 : isMars ? 3 : 1;
    set((state) => ({
      groupLines: [
        ...state.groupLines,
        { from: state.groupAlias || state.nick, text: clean, time: now() },
        { from: reply.from, text: reply.text, time: now() },
      ].slice(-80),
      groupMembers: state.groupMembers.map((member) => member.name === reply.from ? { ...member, favor: member.favor + powerGain } : member),
      adminPower: Math.max(0, Math.min(100, state.adminPower + powerGain + (isMars ? 2 : 0))),
      style: Math.min(100, state.style + (isMars ? 8 : 2)),
      familyRank: state.adminPower + powerGain > 58 ? "临时管理" : state.familyRank,
      eventLog: [`群发言判定：${reply.text}`, ...state.eventLog].slice(0, 8),
    }));
  },
  updateGroupAlias: (alias) => {
    const clean = alias.trim();
    if (!clean) return;
    const perfect = /^ζั͡葬爱✾.{1,8}灬殇$/.test(clean);
    const hasZangAi = clean.includes("葬爱");
    const tooLong = clean.length > 16;
    const adminWord = clean.includes("管理员") || clean.includes("帮主");
    const response = perfect
      ? "系统：马甲格式通过，帮主点了点头。"
      : !hasZangAi
        ? "副管_残血：连葬爱都没有，你是不是卧底？"
        : tooLong
          ? "系统：成员列表被你的超长马甲撑变形了。"
          : adminWord
            ? "帮主_龍少：新人就想写管理员？"
            : "副管_残血：符号不对，重改。";
    set((state) => ({
      groupAlias: clean,
      groupLines: [...state.groupLines, { from: "系统", text: response, time: now(), system: true }].slice(-80),
      adminPower: Math.max(0, Math.min(100, state.adminPower + (perfect ? 15 : adminWord ? -8 : tooLong ? 4 : -2))),
      style: Math.min(100, state.style + (tooLong ? 10 : perfect ? 5 : 1)),
      familyRank: perfect && state.adminPower > 45 ? "临时管理" : state.familyRank,
      eventLog: [`改马甲：${response}`, ...state.eventLog].slice(0, 8),
    }));
  },
  setGroupNotice: (notice) => {
    const clean = notice.trim();
    if (!clean) return;
    const soundsBossy = /不改踢|不是儿戏|统一|规矩|今晚/.test(clean);
    const tooSoft = /随便|大家开心|可以吗|求求/.test(clean);
    const abstract = /灬|葬|殇|泪|永远|家族/.test(clean);
    set((state) => ({
      groupNotice: clean,
      groupLines: [...state.groupLines, { from: state.nick, text: `修改群公告：${clean}`, time: now(), system: true }].slice(-80),
      adminPower: Math.max(0, Math.min(100, state.adminPower + (soundsBossy ? 8 : tooSoft ? -5 : abstract ? 4 : 1))),
      eventLog: [soundsBossy ? "公告像管理：帮主认可，副管警惕" : tooSoft ? "公告太怂：没人服" : "公告已更新", ...state.eventLog].slice(0, 8),
    }));
  },
  runGroupAction: (action, target) => {
    const state = get();
    const hasTempAdmin = state.adminPower >= 55 || state.familyRank === "临时管理";
    const denied = (action === "禁言" || action === "踢人" || action === "改头衔") && !hasTempAdmin;
    const outcome = denied
      ? `系统：你还不是管理，只能发言、私聊、踩空间、拉票。`
      : action === "踢人" && target.includes("小雨")
        ? "系统：你踢了小雨，CP 派开始反叛。"
        : action === "踢人" && target.includes("残血")
          ? "系统：老成员开始刷屏质问你凭什么。"
          : action === "踢人" && target.includes("战神")
            ? "系统：隔壁皇族宣布宣战。"
            : action === "禁言"
              ? `系统：${target} 被禁言 10 秒，群终于安静了一点。`
              : action === "私聊帮主"
                ? "帮主_龍少：你先稳住群，别急着抢位置。"
                : action === "拉小群"
                  ? "系统：你拉了一个三人小群，副管开始怀疑你。"
                  : action === "拉票"
                    ? "系统：有人支持你，也有人截图发给副管。"
                    : `系统：${action} 已执行。`;
    set((current) => ({
      groupLines: [...current.groupLines, { from: current.nick, text: `${action}：${target}`, time: now() }, { from: "系统", text: outcome, time: now(), system: true }].slice(-80),
      adminPower: Math.max(0, Math.min(100, current.adminPower + (denied ? -3 : action === "禁言" ? 6 : action === "私聊帮主" ? 5 : action === "拉票" ? 4 : action === "踢人" ? -6 : 2))),
      eventLog: [`群操作：${outcome}`, ...current.eventLog].slice(0, 8),
    }));
  },
  actOnVisitor: (action, visitor) => {
    const text = action === "截图发群"
      ? `截图发群：${visitor.name} 访问了我的空间 ${visitor.visits} 次。`
      : `${action}：${visitor.name}`;
    set((state) => ({
      groupLines: action === "截图发群" ? [...state.groupLines, { from: state.nick, text, time: now() }].slice(-80) : state.groupLines,
      qzoneMessages: action === "留言" ? [{
        author: visitor.name,
        text: "你刚刚喊我留脚印，我就真来了。记得回踩。",
        time: now(),
        likes: 2 + Math.floor(state.face / 12) + Math.floor(state.adminPower / 16),
      }, ...state.qzoneMessages].slice(0, 24) : state.qzoneMessages,
      spaceVisitors: state.spaceVisitors.map((item) => item.name === visitor.name ? { ...item, visits: item.visits + (action === "回踩" ? 1 : 0), risk: Math.max(0, item.risk - (action === "回踩" ? 8 : 0)) } : item),
      eventLog: [`访客操作：${text}`, ...state.eventLog].slice(0, 8),
    }));
  },
  likePost: (index) =>
    set((state) => ({
      posts: state.posts.map((post, postIndex) => postIndex === index ? { ...post, likes: post.likes + 1, views: post.views + 6 } : post),
      eventLog: ["空间热度上升：有人回赞", ...state.eventLog].slice(0, 8),
    })),
  addQzoneMessage: (text) => {
    const clean = text.trim();
    if (!clean) return;
    const playerId = getPlayerId();
    void postBackend({
      action: "record",
      playerId,
      name: get().nick,
      module: "logs",
      payload: { type: "qzone-message", text: clean, time: now() },
    }).catch(() => undefined);
    set((state) => {
      const incoming = buildIncomingQzoneMessages(clean, state);
      return {
        qzoneMessages: [...incoming, ...state.qzoneMessages].slice(0, 24),
        posts: state.posts.map((post, index) => index === 0 ? { ...post, views: post.views + incoming.length * 8, likes: post.likes + Math.ceil(incoming.length / 2) } : post),
        face: Math.min(100, state.face + Math.max(1, Math.floor(incoming.length / 2))),
        eventLog: [`留言板话题：${clean}，引来 ${incoming.length} 条留言`, ...state.eventLog].slice(0, 8),
      };
    });
  },
  buyQzoneTraffic: (kind) => {
    const cost = kind === "comments" ? 12 : 30;
    const current = get();
    void postBackend({
      action: "record",
      playerId: getPlayerId(),
      name: current.nick,
      module: "logs",
      payload: { type: "qzone-economy", kind, cost, qCoinsBefore: current.qCoins, time: now() },
    }).catch(() => undefined);
    set((state) => {
      if (state.qCoins < cost) {
        return { eventLog: [`Q币不足：需要 ${cost}Q币`, ...state.eventLog].slice(0, 8) };
      }
      if (kind === "diamond") {
        return {
          qCoins: state.qCoins - cost,
          yellowDiamond: state.yellowDiamond + 7,
          face: Math.min(100, state.face + 12),
          style: Math.min(100, state.style + 8),
          eventLog: [`消费 ${cost}Q币开通黄钻 7 天：空间排面上升`, ...state.eventLog].slice(0, 8),
        };
      }
      const incoming = buildIncomingQzoneMessages("花钱刷评论", state, true);
      return {
        qCoins: state.qCoins - cost,
        qzoneMessages: [...incoming, ...state.qzoneMessages].slice(0, 24),
        posts: state.posts.map((post, index) => index === 0
          ? { ...post, views: post.views + incoming.length * 18, likes: post.likes + incoming.length * 3, comments: [...incoming.slice(0, 3).map((message) => ({ author: message.author, text: message.text, time: message.time })), ...post.comments].slice(0, 18) }
          : post),
        face: Math.min(100, state.face + 6),
        eventLog: [`消费 ${cost}Q币刷评论：新增 ${incoming.length} 条互动`, ...state.eventLog].slice(0, 8),
      };
    });
  },
  addEvent: (text) => {
    const playerId = getPlayerId();
    void postBackend({
      action: "record",
      playerId,
      name: get().nick,
      module: "logs",
      payload: { text, time: now() },
    }).catch(() => undefined);
    set((state) => ({ eventLog: [text, ...state.eventLog].slice(0, 8) }));
  },
  setBackendStats: (stats) => set({ backendStats: stats }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  sendWechat: (text) => {
    const clean = text.trim();
    if (!clean) return;
    const playerId = getPlayerId();
    void postBackend({
      action: "record",
      playerId,
      name: get().nick,
      module: "wechat",
      payload: { text: clean, time: now() },
    }).catch(() => undefined);
    set((state) => ({
      wechatMessages: [
        ...state.wechatMessages,
        { from: "me", text: clean, time: now() },
        { from: "wechat", text: "收到。这个模块会独立同步，不走 QQ 聊天记录。", time: now() },
      ],
      eventLog: ["微信模块：独立消息已同步", ...state.eventLog].slice(0, 8),
    }));
  },
  addMoment: (moment) =>
    set((state) => ({
      moments: [moment, ...state.moments].slice(0, 12),
      eventLog: ["朋友圈：大头贴已发布", ...state.eventLog].slice(0, 8),
    })),
  streamCommand: (command) => {
    const text = command.trim();
    if (text.includes("踩踩")) {
      set((state) => ({
        posts: state.posts.map((post, index) => index === 0
          ? { ...post, views: post.views + 100, likes: post.likes + 9, comments: [{ author: "直播观众", text: "踩踩~", time: now() }, ...post.comments] }
          : post),
        eventLog: ["弹幕触发：空间浏览 +100", ...state.eventLog].slice(0, 8),
      }));
    } else if (text.includes("黄钻")) {
      set((state) => ({ yellowDiamond: state.yellowDiamond + 1, face: Math.min(100, state.face + 12), eventLog: ["弹幕赠送黄钻：排面+12", ...state.eventLog].slice(0, 8) }));
    } else if (text.includes("老师来了")) {
      set((state) => ({ openWindow: "netbar", face: Math.max(0, state.face - 8), eventLog: ["随机事件：班主任突袭网吧", ...state.eventLog].slice(0, 8) }));
    } else if (text.includes("妈妈来了")) {
      set((state) => ({ screen: "offline", qqMode: "login", openWindow: null, eventLog: ["妈妈拔网线：QQ断线", ...state.eventLog].slice(0, 8) }));
    } else if (text.includes("emo")) {
      get().addPost("泪落在键盘上，葬AI家族会懂我。");
      set({ openWindow: "space" });
    } else if (text.includes("大头贴")) {
      set((state) => ({ openWindow: "photo", eventLog: ["弹幕触发：进入大头贴机器", ...state.eventLog].slice(0, 8) }));
    }
  },
  setOutfit: (key, value) => set((state) => ({ outfit: { ...state.outfit, [key]: value }, face: Math.min(100, state.face + 5), style: Math.min(100, state.style + 4), eventLog: [`QQ秀更换：${value}`, ...state.eventLog].slice(0, 8) })),
  runScan: () => set((state) => ({ scanReady: true, eventLog: ["联网考古：XP / QQ2009 / QQ空间资料浮现", ...state.eventLog].slice(0, 8) })),
}));

export default function Home() {
  const screen = useGame((state) => state.screen);

  useEffect(() => {
    if (screen === "cover" || screen === "exit") return;
    if (screen === "welcome") {
      const timer = window.setTimeout(() => useGame.getState().setScreen("landing"), 2600);
      return () => window.clearTimeout(timer);
    }
    if (screen === "landing") {
      const timer = window.setTimeout(() => useGame.getState().setScreen("desktop"), 3200);
      return () => window.clearTimeout(timer);
    }
  }, [screen]);

  if (screen === "cover") return <CoverScreen />;
  if (screen === "welcome") return <WelcomeScreen />;
  if (screen === "landing") return <LandingScreen />;
  if (screen === "offline") return <OfflineScreen />;
  if (screen === "exit") return <ExitScreen />;
  return <Desktop />;
}

function CoverScreen() {
  const setScreen = useGame((state) => state.setScreen);
  const loadGame = useGame((state) => state.loadGame);
  const loadPresetDay = useGame((state) => state.loadPresetDay);
  const [notice, setNotice] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [savesOpen, setSavesOpen] = useState(false);
  const start = () => setScreen("welcome");
  const load = () => {
    setSavesOpen(true);
  };
  const loadLocal = () => {
    if (loadGame()) return;
    setNotice("暂无本地自动存档，可读取 Day 1-Day 7 预设记忆");
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <main className="game-cover">
      <div className="cover-frame">
        <Image src="/ui/game-cover.png" alt="葬爱家族模拟器游戏封面" fill priority sizes="min(100vw, 150vh)" />
        <div className="cover-sparkle" />
        <button className="cover-hotspot start" onClick={start} aria-label="开始游戏">开始游戏</button>
        <button className="cover-hotspot load" onClick={load} aria-label="读取存档">读取记忆</button>
        <button className="cover-hotspot catalog" onClick={() => setCatalogOpen(true)} aria-label="葬爱图鉴">葬爱图鉴</button>
        <button className="cover-hotspot exit" onClick={() => setScreen("exit")} aria-label="退出游戏">退出游戏</button>
        {notice && <p className="cover-notice">{notice}</p>}
        {savesOpen && <SaveOverlay onClose={() => setSavesOpen(false)} onLoadLocal={loadLocal} onLoadDay={loadPresetDay} />}
        {catalogOpen && <CatalogOverlay onClose={() => setCatalogOpen(false)} />}
      </div>
    </main>
  );
}

function SaveOverlay({ onClose, onLoadLocal, onLoadDay }: { onClose: () => void; onLoadLocal: () => void; onLoadDay: (day: number) => void }) {
  return (
    <section className="cover-saves">
      <button className="save-close" onClick={onClose}>×</button>
      <header>
        <span>MEMORY CARD 2009</span>
        <h2>读取记忆</h2>
        <p>页游七天流程存档。可以读取本地自动存档，也可以直接进入任意一天。</p>
      </header>
      <button className="local-save" onClick={onLoadLocal}>
        <b>自动存档</b>
        <span>读取你上一次同步保存的真实进度</span>
      </button>
      <div className="save-grid">
        {presetDaySaves.map((save, index) => {
          const day = index + 1;
          return (
            <button key={save.title} onClick={() => onLoadDay(day)}>
              <i>DAY {day}</i>
              <b>{save.title}</b>
              <p>{save.subtitle}</p>
              <span>{save.familyRank} · 排面 {save.face} · 权限 {save.adminPower}</span>
            </button>
          );
        })}
      </div>
      <footer>
        <strong>7 Days</strong>
        <span>入群 → 空间 → 失恋 → 入侵 → 怀疑 → 内战 → 选举</span>
      </footer>
    </section>
  );
}

function CatalogOverlay({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState("核心系统");
  const entries = [
    { group: "核心系统", name: "QQ2009", state: "已接入", detail: "账号登录、好友列表、AI聊天、QQ秀侧栏和账号找回。", tags: ["登录", "聊天", "好友"] },
    { group: "核心系统", name: "葬AI家族群", state: "已接入", detail: "输入发言、改马甲、群公告、禁言踢人和管理员权力争夺。", tags: ["群聊", "马甲", "管理"] },
    { group: "核心系统", name: "QQ空间", state: "已接入", detail: "发说说钓访客、留言板、回踩、Q币刷评论和黄钻排面。", tags: ["说说", "访客", "黄钻"] },
    { group: "创作工具", name: "大头贴机器", state: "已接入", detail: "调用摄像头，选择模板和贴纸，生成四连拍发朋友圈。", tags: ["摄像头", "贴纸", "传播"] },
    { group: "创作工具", name: "火星文生成器", state: "已接入", detail: "普通文字转成火星文，可复制、清空、分享进 QQ空间。", tags: ["火星文", "签名", "分享"] },
    { group: "创作工具", name: "Winamp", state: "已接入", detail: "调用 YYMP3 非主流歌曲榜，刷新歌单并保留像素播放器。", tags: ["音乐", "YYMP3", "榜单"] },
    { group: "桌面生态", name: "QQ邮箱", state: "已接入", detail: "粉色 QQ邮箱界面，可读邮件、回复、星标保存证据。", tags: ["邮件", "证据", "收件箱"] },
    { group: "桌面生态", name: "微信", state: "独立模块", detail: "未来通讯模块，消息单独同步，不混入 QQ 聊天记录。", tags: ["独立", "同步", "未来线"] },
    { group: "桌面生态", name: "电脑管家 / 网吧", state: "已接入", detail: "网吧地图、老师来了、妈妈拔网线、系统风险和断线黑屏。", tags: ["网吧", "风险", "断线"] },
    { group: "资料片", name: "QQ农场 / 牧场", state: "入口预留", detail: "目前连接到空间访客经济，后续可扩展偷菜和牧场访问。", tags: ["偷菜", "访客", "扩展"] },
    { group: "资料片", name: "红钻 / 黄钻 / 绿钻", state: "已串联", detail: "分别连接 QQ秀、空间装扮和音乐排面，消耗 Q币形成经济。", tags: ["Q币", "排面", "会员"] },
    { group: "资料片", name: "消息管理器", state: "已接入", detail: "查看后端同步、玩家数量、系统日志和模块事件。", tags: ["后端", "日志", "统计"] },
  ];
  const groups = [...new Set(entries.map((entry) => entry.group))];
  const visibleEntries = entries.filter((entry) => entry.group === active);
  const activeIndex = Math.max(0, groups.indexOf(active));
  const selectRelativeGroup = (step: number) => {
    const next = (activeIndex + step + groups.length) % groups.length;
    setActive(groups[next]);
  };

  return (
    <section className="cover-catalog" aria-label={`葬爱图鉴：${active}，${visibleEntries.length} 个条目`}>
      <Image src="/ui/catalog.png" alt="葬爱图鉴" fill priority sizes="min(96vw, 128vh)" />
      <button className="catalog-hotspot catalog-close" onClick={onClose} aria-label="关闭葬爱图鉴">关闭</button>
      <nav aria-label="图鉴分类">
        {groups.map((group, index) => (
          <button
            key={group}
            className={`catalog-hotspot catalog-tab tab-${index + 1} ${active === group ? "active" : ""}`}
            onClick={() => setActive(group)}
            aria-label={`切换到${group}`}
          >
            {group}
          </button>
        ))}
      </nav>
      <button className="catalog-hotspot catalog-prev" onClick={() => selectRelativeGroup(-1)} aria-label="上一页">上一页</button>
      <button className="catalog-hotspot catalog-next" onClick={() => selectRelativeGroup(1)} aria-label="下一页">下一页</button>
      <span className="sr-only">当前分类：{active}。条目：{visibleEntries.map((entry) => entry.name).join("、")}。</span>
    </section>
  );
}

function ExitScreen() {
  const setScreen = useGame((state) => state.setScreen);
  return (
    <main className="exit-screen">
      <section>
        <h1>游戏已退出</h1>
        <p>爱过，痛过，才是青春。</p>
        <button onClick={() => setScreen("cover")}>返回首页</button>
      </section>
    </main>
  );
}

function OfflineScreen() {
  const setScreen = useGame((state) => state.setScreen);
  const openApp = useGame((state) => state.openApp);
  const reconnect = () => {
    setScreen("desktop");
    openApp("qq");
  };

  return (
    <main className="offline-screen">
      <div className="offline-glow" />
      <section className="offline-dialog">
        <h1>连接已中断</h1>
        <p>妈妈拔掉了网线。</p>
        <small>QQ2009.exe 无法连接到服务器。请检查网线，或等待饭后重新上线。</small>
        <button onClick={reconnect}>重新连接</button>
      </section>
    </main>
  );
}

function WelcomeScreen() {
  return (
    <main className="xp-welcome">
      <Image src="/ui/xp-welcome.png" alt="Windows XP welcome screen" fill priority sizes="100vw" />
      <div className="boot-scanlines" />
      <div className="welcome-loading">
        <span>正在加载个人设置</span>
        <i />
        <i />
        <i />
      </div>
    </main>
  );
}

function LandingScreen() {
  return (
    <main className="xp-landing">
      <img src="/ui/xp-loading.gif" alt="QQ2009 Windows XP loading" />
    </main>
  );
}

function Desktop() {
  const openWindow = useGame((state) => state.openWindow);

  useEffect(() => {
    const playerId = getPlayerId();
    let cancelled = false;

    const sync = async () => {
      const state = useGame.getState();
      try {
        state.setSyncStatus("同步中");
        const result = await postBackend({
          action: "sync",
          playerId,
          name: state.nick,
          modules: {
            logs: state.eventLog,
            qq: {
              activeNpc: state.activeNpc,
              messages: state.messages,
              posts: state.posts,
              qzoneMessages: state.qzoneMessages,
              groupLines: state.groupLines,
              groupMembers: state.groupMembers,
              spaceVisitors: state.spaceVisitors,
              groupAlias: state.groupAlias,
              groupNotice: state.groupNotice,
              adminPower: state.adminPower,
            },
            wechat: { messages: state.wechatMessages, moments: state.moments },
          },
        });
        if (!cancelled && result.stats) {
          state.saveGame();
          useGame.getState().setBackendStats(result.stats);
          useGame.getState().setSyncStatus("已同步");
        }
      } catch {
        if (!cancelled) useGame.getState().setSyncStatus("离线");
      }
    };

    sync();
    const timer = window.setInterval(sync, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="xp-desktop">
      <div className="desktop-icons">
        {desktopIcons.map((item) => <DesktopIcon key={item.label} item={item} />)}
      </div>
      <SystemBubble />
      {openWindow && <AppWindow id={openWindow} />}
      <Taskbar />
    </main>
  );
}

function DesktopIcon({ item }: { item: (typeof desktopIcons)[number] }) {
  const openApp = useGame((state) => state.openApp);
  const iconSrc = `/desktop-icons/${item.file}?v=${desktopIconVersion}`;
  return (
    <button className="desktop-icon" onClick={() => openApp(item.id)}>
      <Image src={iconSrc} alt="" width={58} height={58} />
      <b>{item.label}</b>
    </button>
  );
}

function AppWindow({ id }: { id: WindowId }) {
  const closeWindow = useGame((state) => state.closeWindow);
  const qqMode = useGame((state) => state.qqMode);
  const [maximized, setMaximized] = useState(false);
  const isQqLogin = id === "qq" && qqMode === "login";
  const isNativeArt = id === "qq" || id === "space" || id === "mail" || id === "photo";
  const controls: WindowControls = {
    close: closeWindow,
    minimize: closeWindow,
    maximize: () => setMaximized((value) => !value),
    maximized,
  };
  const titles: Record<WindowId, string> = {
    computer: "我的电脑",
    docs: "我的文档",
    ie: "Internet Explorer",
    ieClassic: "Internet",
    qq: "QQ2009",
    wechat: "微信",
    trash: "回收站",
    music: "QQ音乐",
    winamp: "Winamp",
    netbar: "网上邻居 - 风云网吧",
    space: "QQ空间 - 个人中心",
    photo: "大头贴机器",
    farm: "QQ农场",
    ranch: "QQ牧场",
    games: "游戏中心",
    family: "葬AI家族群",
    notepad: "记事本",
    show: "QQ秀衣柜",
    mars: "QQ2009 - 火星文生成器",
    mail: "QQ邮箱",
    calendar: "日历",
    search: "搜索文件",
    help: "帮助与支持",
    storm: "暴风影音",
    mobileqq: "手机QQ",
    friends: "我的好友",
    burn: "刻录光盘",
    redDiamond: "红钻贵族",
    greenDiamond: "绿钻贵族",
    yellowDiamond: "黄钻贵族",
    superVip: "超级会员",
    vipCenter: "会员中心",
    winrar: "WinRAR",
    pcManager: "电脑管家",
  };
  return (
    <section className={`xp-window app-window ${maximized ? "is-maximized" : ""} ${isNativeArt ? "native-art-shell" : ""} ${id === "qq" ? "qq-shell" : ""} ${isQqLogin ? "qq-login-shell" : ""}`}>
      {!isNativeArt && <WindowTitle title={titles[id]} maximized={maximized} onMinimize={controls.minimize} onMaximize={controls.maximize} onClose={controls.close} />}
      {isNativeArt && id !== "qq" && <NativeWindowControls id={id} controls={controls} />}
      <div className="window-scroll">
        <WindowContent id={id} title={titles[id]} controls={controls} />
      </div>
    </section>
  );
}

function WindowContent({ id, title, controls }: { id: WindowId; title: string; controls: WindowControls }) {
  if (id === "qq") return <QQApp controls={controls} />;
  if (id === "space") return <QzoneApp />;
  if (id === "photo") return <PhotoPanel />;
  if (id === "show") return <ShowPanel />;
  if (id === "redDiamond") return <ShowPanel />;
  if (id === "mars") return <MarsPanel />;
  if (id === "mail") return <MailPanel />;
  if (id === "winamp") return <WinampPanel />;
  if (id === "family") return <FamilyPanel />;
  if (id === "netbar") return <NetbarPanel />;
  if (id === "wechat") return <WechatPanel />;
  if (id === "ie" || id === "ieClassic") return <ArchaeologyBrowser />;
  if (id === "notepad") return <NotepadPanel />;
  if (id === "friends") return <FriendsPanel />;
  return <ShortcutPanel id={id} title={title} />;
}

function NativeWindowControls({ id, controls }: { id: WindowId; controls: WindowControls }) {
  return (
    <div className={`native-window-controls native-${id}`}>
      <button type="button" aria-label="最小化窗口" onClick={controls.minimize}>_</button>
      <button type="button" aria-label={controls.maximized ? "还原窗口" : "最大化窗口"} onClick={controls.maximize}>{controls.maximized ? "❐" : "□"}</button>
      <button type="button" aria-label="关闭窗口" onClick={controls.close}>×</button>
    </div>
  );
}

function WindowTitle({ title, onMinimize, onMaximize, onClose, maximized, blue, pink }: { title: string; onMinimize?: () => void; onMaximize?: () => void; onClose?: () => void; maximized?: boolean; blue?: boolean; pink?: boolean }) {
  return (
    <div className={`window-title ${blue ? "blue" : ""} ${pink ? "pink" : ""}`}>
      <span>{pink && <i className="mini-penguin" />} {title}</span>
      <div>
        <button type="button" aria-label="最小化" onClick={onMinimize}>_</button>
        <button type="button" aria-label={maximized ? "还原" : "最大化"} onClick={onMaximize}>{maximized ? "❐" : "□"}</button>
        <button type="button" aria-label="关闭" onClick={onClose}>×</button>
      </div>
    </div>
  );
}

function QQApp({ controls }: { controls: WindowControls }) {
  const qqMode = useGame((state) => state.qqMode);
  if (qqMode === "login") return <QQLogin />;
  if (qqMode === "booting") return <QQBooting controls={controls} />;
  if (qqMode === "friends") return <QQFriendsPanel controls={controls} />;
  return <QQChat controls={controls} />;
}

function QQBooting({ controls }: { controls: WindowControls }) {
  return (
    <div className="qq-progress-art">
      <img src="/ui/qq2009-loading.gif" alt="QQ2009 正在登录" />
      <QQNativeControls controls={controls} />
    </div>
  );
}

function QQFriendsPanel({ controls }: { controls: WindowControls }) {
  const setActiveNpc = useGame((state) => state.setActiveNpc);
  return (
    <div className="qq-friends-art">
      <Image src="/ui/qq-friends-panel.png" alt="QQ2009 好友栏目" fill priority sizes="min(92vw, 420px)" />
      <QQNativeControls controls={controls} />
      <div className="qq-friends-hotspots">
        {(Object.keys(npcs) as NpcId[]).map((id, index) => (
          <button key={id} style={{ top: `${38 + index * 8}%` }} onClick={() => setActiveNpc(id)}>
            {npcs[id].name}
          </button>
        ))}
      </div>
    </div>
  );
}

function QQNativeControls({ controls }: { controls: WindowControls }) {
  return (
    <div className={`qq-native-controls ${controls.maximized ? "is-maximized" : ""}`}>
      <button type="button" aria-label="最小化 QQ" onClick={controls.minimize}>_</button>
      <button type="button" aria-label={controls.maximized ? "还原 QQ" : "最大化 QQ"} onClick={controls.maximize}>{controls.maximized ? "❐" : "□"}</button>
      <button type="button" aria-label="关闭 QQ" onClick={controls.close}>×</button>
    </div>
  );
}

function QQLogin() {
  const qqLogin = useGame((state) => state.qqLogin);
  const closeWindow = useGame((state) => state.closeWindow);
  const [mode, setMode] = useState<"login" | "register" | "recover" | "invites">("login");
  const [account, setAccount] = useState("20090001");
  const [nickname, setNickname] = useState("冷少");
  const [phone, setPhone] = useState("13800002009");
  const [inviteCode, setInviteCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [inviteLibrary, setInviteLibrary] = useState<InviteCodeView[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("测试账号 20090001 / 密码 123456");
  const [busy, setBusy] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [presence, setPresence] = useState<"在线" | "隐身" | "忙碌">("在线");
  const nextPresence = () => setPresence((current) => current === "在线" ? "隐身" : current === "隐身" ? "忙碌" : "在线");
  const toggleRemember = () => {
    setRememberPassword((current) => {
      if (current) setAutoLogin(false);
      return !current;
    });
  };
  const toggleAutoLogin = () => {
    setAutoLogin((current) => {
      if (!rememberPassword && !current) {
        setRememberPassword(true);
      }
      return !current;
    });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "login") {
        const result = await postAccount({ action: "login", qq: account, password });
        qqLogin(result.account?.nickname || account);
        return;
      }
      if (mode === "register") {
        const result = await postAccount({ action: "register", qq: account, nickname, phone, password, inviteCode });
        setInviteLibrary(result.invites ?? []);
        setMode("login");
        setNotice(`注册成功：${result.account?.nickname ?? account}，现在可以登录`);
        setPassword("");
        return;
      }
      if (mode === "recover") {
        const result = await postAccount({ action: "reset-password", qq: account, phone, code: verifyCode, password });
        setMode("login");
        setNotice(`密码已重设：${result.account?.nickname ?? account}`);
        setVerifyCode("");
        setPassword("");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败");
      if (mode === "login") setMode("recover");
    } finally {
      setBusy(false);
    }
  };
  const requestCode = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await postAccount({ action: "request-code", qq: account, phone });
      setVerifyCode(result.code ?? "");
      setNotice(`手机验证码：${result.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "验证码发送失败");
    } finally {
      setBusy(false);
    }
  };
  const applyInvite = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await postAccount({ action: "apply-invite" });
      setInviteCode(typeof result.code === "string" ? result.code : inviteCode);
      setInviteLibrary(result.invites ?? []);
      setNotice(`随机申请邀请码：${result.code}`);
      setMode("invites");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "邀请码申请失败");
    } finally {
      setBusy(false);
    }
  };
  const loadInvites = async () => {
    setMode("invites");
    setInviteLibrary(await getInviteLibrary());
  };
  return (
    <form className="qq-login-art" onSubmit={submit}>
      <Image src="/ui/qq-login.png" alt="QQ2009 login" fill priority sizes="min(92vw, 980px)" />
      <input
        className="qq-account-input"
        value={account}
        onChange={(event) => {
          setAccount(event.target.value);
          setError("");
        }}
        aria-label="QQ账号"
        autoComplete="username"
      />
      <input
        className="qq-password-input"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError("");
        }}
        aria-label="QQ密码"
        type="password"
        placeholder={mode === "recover" ? "输入新密码" : ""}
        autoComplete={mode === "register" ? "new-password" : "current-password"}
      />
      {(error || notice) && <div className={`qq-login-error ${error ? "" : "notice"}`}>{error || notice}</div>}
      <button className="qq-status-hotspot" type="button" aria-label="切换状态" onClick={nextPresence} />
      <div className={`qq-status-indicator ${presence}`} data-label={presence}>{presence}</div>
      <button className="qq-remember-hotspot" type="button" aria-label="记住密码" onClick={toggleRemember} />
      <button className="qq-auto-hotspot" type="button" aria-label="自动登录" onClick={toggleAutoLogin} />
      {rememberPassword && <span className="qq-checkmark remember">✓</span>}
      {autoLogin && <span className="qq-checkmark auto">✓</span>}
      <button className="qq-register-hotspot" type="button" aria-label="注册新账号" onClick={() => setMode("register")} />
      <button className="qq-recover-hotspot" type="button" aria-label="取回密码" onClick={() => setMode("recover")} />
      <button className="qq-login-hotspot" type="submit" aria-label="登录 QQ2009" disabled={busy} />
      <button className="qq-close-hotspot" type="button" aria-label="关闭 QQ2009" onClick={closeWindow} />
      {mode !== "login" && (
        <section className="qq-account-panel">
          <header>
            <b>{mode === "register" ? "注册新账号" : mode === "recover" ? "取回密码" : "邀请码库"}</b>
            <button type="button" onClick={() => setMode("login")}>返回登录</button>
          </header>
          {mode === "register" && (
            <>
              <label>昵称<input value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
              <label>手机<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <label>邀请码<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} /></label>
              <menu>
                <button type="button" onClick={applyInvite} disabled={busy}>随机申请邀请码</button>
                <button type="button" onClick={loadInvites}>查看邀请码库</button>
                <button type="submit" disabled={busy}>完成注册</button>
              </menu>
              <small>填写 QQ号、密码、手机号和邀请码后，点原界面的“登录”按钮完成注册。</small>
            </>
          )}
          {mode === "recover" && (
            <>
              <label>绑定手机<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <label>验证码<input value={verifyCode} onChange={(event) => setVerifyCode(event.target.value)} /></label>
              <menu>
                <button type="button" onClick={requestCode} disabled={busy}>登录手机获取验证码</button>
                <button type="button" onClick={loadInvites}>查看邀请码库</button>
                <button type="submit" disabled={busy}>重设密码</button>
              </menu>
              <small>输入新密码和手机验证码后，点原界面的“登录”按钮重设密码。</small>
            </>
          )}
          {mode === "invites" && (
            <>
              <menu>
                <button type="button" onClick={applyInvite} disabled={busy}>随机申请邀请码</button>
                <button type="button" onClick={() => setMode("register")}>去注册</button>
              </menu>
              <div className="qq-invite-list">
                {inviteLibrary.map((invite) => (
                  <button key={invite.code} type="button" onClick={() => {
                    if (invite.status === "available") {
                      setInviteCode(invite.code);
                      setMode("register");
                    }
                  }}>
                    <b>{invite.code}</b>
                    <span>{invite.status === "available" ? "可用" : `已用 ${invite.usedBy ?? ""}`}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </form>
  );
}

function QQChat({ controls }: { controls: WindowControls }) {
  const activeNpc = useGame((state) => state.activeNpc);
  const messages = useGame((state) => state.messages[activeNpc]);
  const sendMessage = useGame((state) => state.sendMessage);
  const runScan = useGame((state) => state.runScan);
  const [text, setText] = useState("");
  const [showQshow, setShowQshow] = useState(true);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(text);
    setText("");
  };
  return (
    <div className="qq-chat-art">
      <Image src="/ui/qq-chat-bg.png" alt="QQ2009 聊天窗口" fill priority sizes="min(1180px, 100vw)" />
      <QQNativeControls controls={controls} />
      <button className="scan-button art-scan" onClick={runScan}>联网考古</button>
      <div className="qq-art-messages">
        {messages.map((message, index) => (
          <div key={`${message.time}-${index}`} className={message.from === "me" ? "me" : ""}>
            <small>{message.from === "me" ? "我" : npcs[message.from].name} {message.time}</small>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <form className="qq-art-input" onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} />
        <button type="submit" aria-label="发送 QQ 消息" />
      </form>
      {showQshow ? (
        <div className="qq-art-show">
          <button className="qq-show-close" type="button" aria-label="关闭 QQ秀" onClick={() => setShowQshow(false)}>×</button>
          <QQShowRevival compact />
        </div>
      ) : (
        <button className="qq-show-restore" type="button" onClick={() => setShowQshow(true)}>打开QQ秀</button>
      )}
      <ArchaeologyFloat />
    </div>
  );
}

function QQShowRevival({ compact = false }: { compact?: boolean }) {
  const outfit = useGame((state) => state.outfit);
  if (compact) {
    return (
      <a className="qqshow-revival compact external" href={qshowUrl} target="_blank" rel="noreferrer">
        <b>QQ秀</b>
        <span>复活项目</span>
        <i>{outfit.accessory}</i>
      </a>
    );
  }

  return (
    <div className="qqshow-revival">
      <iframe src={qshowUrl} title="Love of QShow QQ秀复活项目" loading="lazy" />
      <div className="qshow-fallback">
        <b>QQ秀复活项目</b>
        <span>{outfit.hair} · {outfit.accessory}</span>
        <a href={qshowUrl} target="_blank" rel="noreferrer">打开 loveofqshow.online</a>
      </div>
    </div>
  );
}

function ArchaeologyFloat() {
  const scanReady = useGame((state) => state.scanReady);
  if (!scanReady) return null;
  return (
    <div className="arch-float">
      <article><b>XP Welcome</b><span>用户头像 + 正在加载个人设置</span></article>
      <article><b>QQ2009</b><span>粉色皮肤、工具栏、QQ秀侧栏</span></article>
      <article><b>QQ空间</b><span>日志/相册/留言/装扮/黄钻</span></article>
    </div>
  );
}

function QzoneApp() {
  const posts = useGame((state) => state.posts);
  const qzoneMessages = useGame((state) => state.qzoneMessages);
  const visitors = useGame((state) => state.spaceVisitors);
  const nick = useGame((state) => state.nick);
  const face = useGame((state) => state.face);
  const style = useGame((state) => state.style);
  const adminPower = useGame((state) => state.adminPower);
  const yellowDiamond = useGame((state) => state.yellowDiamond);
  const familyRank = useGame((state) => state.familyRank);
  const qCoins = useGame((state) => state.qCoins);
  const addPost = useGame((state) => state.addPost);
  const likePost = useGame((state) => state.likePost);
  const addQzoneMessage = useGame((state) => state.addQzoneMessage);
  const buyQzoneTraffic = useGame((state) => state.buyQzoneTraffic);
  const actOnVisitor = useGame((state) => state.actOnVisitor);
  const [mode, setMode] = useState<"说说" | "发日志" | "留言">("说说");
  const [text, setText] = useState("葬AI家族，永不言弃。");
  const marsPreview = useMemo(() => toMars(text), [text]);
  const boostedMessages = useMemo(() => {
    const influence = qzoneClout(face, style, adminPower, yellowDiamond, familyRank);
    const generated = rankBoardMessages
      .filter((message) => style >= message.minStyle)
      .map((message, index) => ({
        author: message.author,
        text: message.text,
        time: index < 2 ? "今天 10:2" + index : "今天 09:" + (58 - index),
        likes: influence + Math.floor(face / 10) + index * 2,
      }));
    const incoming = qzoneMessages.filter((message) => message.author !== nick);
    const manualKeys = new Set(incoming.map((message) => `${message.author}-${message.text}`));
    return [...incoming, ...generated.filter((message) => !manualKeys.has(`${message.author}-${message.text}`))].slice(0, 6 + Math.min(10, influence));
  }, [adminPower, face, familyRank, nick, qzoneMessages, style, yellowDiamond]);
  return (
    <div className="qzone-app">
      <div className="qzone-home-art">
        <Image src="/ui/qzone-empty.png" alt="QQ空间 2008 空状态首页" fill sizes="min(1180px, 100vw)" />
        <div className="qzone-actions">
          {(["留言", "发日志", "说说"] as const).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === "留言") addQzoneMessage(text);
          else addPost(text);
          setText("");
        }}
        className="qzone-compose"
      >
        <label>{mode}</label>
        <textarea value={text} onChange={(event) => setText(event.target.value)} />
        <div>{marsPreview}</div>
        <button>{mode === "留言" ? "发布留言话题" : mode === "发日志" ? "发表日志" : "发表说说"}</button>
      </form>
      <section className="qzone-posts">
        {posts.map((post, index) => (
          <article key={`${post.text}-${index}`}>
            <h3>{post.mood}日志</h3>
            <p>{post.text}</p>
            <small>状态 {heatLabel(post.views, post.likes)} · 访客回响 {post.comments.length}</small>
            <menu>
              <button type="button" onClick={() => likePost(index)}>回赞热度</button>
            </menu>
            <div>
              {post.comments.map((comment, i) => (
                <span key={`${comment.author}-${comment.text}-${i}`}>
                  <b>{comment.author}</b>{comment.text}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
      <section className="visitor-panel">
        <h3>最近访客推理</h3>
        {visitors.map((visitor) => (
          <article key={visitor.name}>
            <b>{visitor.name}</b>
            <p>访问 {visitor.visits} 次 · {visitor.intent} · {riskLabel(visitor.risk)}</p>
            <menu>
              {["回踩", "留言", "截图发群"].map((action) => <button key={action} type="button" onClick={() => actOnVisitor(action, visitor)}>{action}</button>)}
            </menu>
          </article>
        ))}
      </section>
      <section className="qzone-board">
        <h3>别人给我的留言 <em>{familyRank} · 黄钻 {yellowDiamond} 天</em></h3>
        <div className="qzone-wallet">
          <b>Q币余额 {qCoins}</b>
          <span>排面越高，留言和点赞越多</span>
          <button type="button" onClick={() => buyQzoneTraffic("comments")}>刷评论 -12Q币</button>
          <button type="button" onClick={() => buyQzoneTraffic("diamond")}>开黄钻 -30Q币</button>
        </div>
        {boostedMessages.map((message, index) => (
          <article key={`${message.author}-${message.time}-${index}`}>
            <b>{message.author}</b>
            <p>{message.text}</p>
            <small>{message.time} · ♥ {message.likes}</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function PhotoPanel() {
  const photoCanvasSize = { width: 540, height: 720 };
  const photoFrameRect = { x: 38, y: 58, width: 464, height: 560 };
  const photoViewportRect = { x: 58, y: 92, width: 424, height: 492 };
  const nick = useGame((state) => state.nick);
  const addMoment = useGame((state) => state.addMoment);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState("摄像头未开启");
  const [template, setTemplate] = useState("蝴蝶结");
  const [element, setElement] = useState("爱心");
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("摄像头已开启");
    } catch {
      setCameraStatus("摄像头不可用，可继续生成占位大头贴");
    }
  };

  const generate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = photoCanvasSize.width;
    canvas.height = photoCanvasSize.height;
    const video = videoRef.current;
    ctx.fillStyle = "#fff4fb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (video?.srcObject && video.videoWidth) {
      const viewportRatio = photoViewportRect.width / photoViewportRect.height;
      const videoRatio = video.videoWidth / video.videoHeight;
      const sourceWidth = videoRatio > viewportRatio ? video.videoHeight * viewportRatio : video.videoWidth;
      const sourceHeight = videoRatio > viewportRatio ? video.videoHeight : video.videoWidth / viewportRatio;
      const sourceX = (video.videoWidth - sourceWidth) / 2;
      const sourceY = (video.videoHeight - sourceHeight) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(photoViewportRect.x, photoViewportRect.y, photoViewportRect.width, photoViewportRect.height);
      ctx.clip();
      ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, photoViewportRect.x, photoViewportRect.y, photoViewportRect.width, photoViewportRect.height);
      ctx.restore();
    } else {
      ctx.fillStyle = "#ffe0ef";
      ctx.fillRect(photoViewportRect.x, photoViewportRect.y, photoViewportRect.width, photoViewportRect.height);
      ctx.fillStyle = "#e94e98";
      ctx.font = "900 72px serif";
      ctx.textAlign = "center";
      ctx.fillText(nick.slice(0, 2), photoViewportRect.x + photoViewportRect.width / 2, photoViewportRect.y + photoViewportRect.height / 2);
    }
    ctx.lineWidth = 18;
    ctx.strokeStyle = template === "格子" ? "#ff9bcc" : template === "翅膀" ? "#ff74b8" : "#f04a9a";
    ctx.strokeRect(photoFrameRect.x, photoFrameRect.y, photoFrameRect.width, photoFrameRect.height);
    ctx.fillStyle = "#f04a9a";
    ctx.font = "900 34px serif";
    ctx.textAlign = "left";
    ctx.fillText("QQ2009", 58, 665);
    ctx.textAlign = "right";
    ctx.fillText(element === "星星" ? "★ ★ ★" : element === "音符" ? "♪ ♫ ♪" : "♡ ♡ ♡", 482, 665);
    setPhoto(canvas.toDataURL("image/png"));
  };

  const publish = () => {
    if (!photo) generate();
    const image = photo || canvasRef.current?.toDataURL("image/png") || "";
    if (image) addMoment({ image, caption: `${nick} 的 QQ2009 大头贴：${template} + ${element}`, time: now() });
  };

  return (
    <div className="photo-panel">
      <div className="photo-art-board">
        <Image src="/ui/photo-stickers.png" alt="QQ2009 大头贴素材" fill sizes="min(760px, 100vw)" />
      </div>
      <section className="photo-camera">
        <h2>大头贴机器</h2>
        <p>{cameraStatus}</p>
        <div className="photo-live-frame" data-template={template}>
          <video ref={videoRef} playsInline muted />
          <span className="photo-live-label">QQ2009</span>
          <span className="photo-live-deco">{element === "星星" ? "★ ★ ★" : element === "音符" ? "♪ ♫ ♪" : "♡ ♡ ♡"}</span>
        </div>
        <div className="photo-controls">
          <button onClick={startCamera}>开启摄像头</button>
          <label>模板<select value={template} onChange={(event) => setTemplate(event.target.value)}><option>蝴蝶结</option><option>格子</option><option>翅膀</option></select></label>
          <label>元素<select value={element} onChange={(event) => setElement(event.target.value)}><option>爱心</option><option>星星</option><option>音符</option></select></label>
          <button onClick={generate}>生成照片</button>
          <button onClick={publish}>发朋友圈</button>
        </div>
        <canvas ref={canvasRef} />
        {photo && <img className="generated-photo" src={photo} alt="生成的大头贴" />}
      </section>
    </div>
  );
}

function ShowPanel() {
  const outfit = useGame((state) => state.outfit);
  const setOutfit = useGame((state) => state.setOutfit);
  const options = { hair: ["斜刘海", "爆炸头", "挑染红发"], top: ["黑红铆钉外套", "骷髅T恤", "情侣装上衣"], accessory: ["荧光翅膀", "铆钉项链", "黄钻皇冠"] } as const;
  const labels = { hair: "发型", top: "上衣", accessory: "配饰" } as const;
  return (
    <div className="show-panel">
      <section className="qshow-stage">
        <header>
          <b>QQ秀复活项目</b>
          <a href={qshowUrl} target="_blank" rel="noreferrer">新窗口打开</a>
        </header>
        <QQShowRevival />
      </section>
      <aside className="closet">
        <h2>红钻同步</h2>
        <p>{outfit.hair} · {outfit.top} · {outfit.accessory}</p>
        {Object.entries(options).map(([key, values]) => (
          <section key={key}>
            <h3>{labels[key as keyof typeof labels]}</h3>
            {values.map((value) => (
              <button
                key={value}
                className={outfit[key as keyof typeof outfit] === value ? "active" : ""}
                onClick={() => setOutfit(key as keyof typeof outfit, value)}
              >
                {value}
              </button>
            ))}
          </section>
        ))}
      </aside>
    </div>
  );
}

function MailPanel() {
  const addEvent = useGame((state) => state.addEvent);
  return (
    <div className="mail-panel">
      <Image src="/ui/qq-mail.png" alt="QQ邮箱收件箱" fill sizes="min(1180px, 100vw)" />
      <div className="mail-actions">
        <button onClick={() => addEvent("QQ邮箱：读取小鱼の泪的来信")}>读邮件</button>
        <button onClick={() => addEvent("QQ邮箱：回复一封粉色边框邮件")}>回复</button>
        <button onClick={() => addEvent("QQ邮箱：星标邮件已保存为家族证据")}>星标</button>
      </div>
    </div>
  );
}

function WinampPanel() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<WinampTrack[]>(winampFallbackTracks);
  const [track, setTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(34);
  const [sourceState, setSourceState] = useState("正在连接 YYMP3 非主流榜...");
  const [audioStatus, setAudioStatus] = useState("真实音频：等待播放");

  const loadTracks = useCallback(async () => {
    try {
      const response = await fetch("/api/winamp");
      const data = (await response.json()) as { tracks?: WinampTrack[]; source?: string; fromFallback?: boolean };
      const nextTracks = data.tracks?.length
        ? data.tracks.map((item, index) => ({ ...winampFallbackTracks[index], ...item }))
        : winampFallbackTracks;
      setTracks(nextTracks);
      setTrack((current) => Math.min(current, nextTracks.length - 1));
      setSourceState(data.fromFallback ? "YYMP3 连接慢，已载入本地非主流榜缓存" : `已调用 ${data.source ?? "YYMP3 非主流榜"}`);
    } catch {
      setTracks(winampFallbackTracks);
      setSourceState("YYMP3 连接失败，已载入本地非主流榜缓存");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTracks();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTracks]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    setPlaying(false);
    setAudioStatus(tracks[track]?.audioSrc ? "真实音频：已选择本地文件" : "真实音频：缺少授权音频文件");
  }, [track, tracks]);

  const start = async () => {
    const audio = audioRef.current;
    const current = tracks[track];
    if (!audio || !current?.audioSrc) {
      setPlaying(false);
      setAudioStatus("真实音频：请把授权 MP3 放入 public/audio/");
      return;
    }
    try {
      audio.volume = volume / 100;
      await audio.play();
      setPlaying(true);
      setAudioStatus(`正在播放：${current.title}`);
    } catch {
      setPlaying(false);
      setAudioStatus("真实音频：文件未找到或浏览器阻止播放");
    }
  };
  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
    setAudioStatus("真实音频：已暂停");
  };
  const chooseTrack = (index: number) => {
    setTrack(index);
  };
  const step = (direction: number) => {
    chooseTrack((track + direction + tracks.length) % tracks.length);
  };

  return (
    <div className="winamp-panel">
      <section className="winamp-player">
        <header><b>WINAMP</b><span>{playing ? "PLAY" : "STOP"}</span></header>
        <div className="winamp-display">
          <strong>{tracks[track]?.title ?? "非主流榜单加载中"}</strong>
          <span>{tracks[track]?.artist ?? "YYMP3"} · {audioStatus}</span>
        </div>
        <audio
          ref={audioRef}
          src={tracks[track]?.audioSrc}
          preload="metadata"
          onEnded={() => {
            setPlaying(false);
            step(1);
          }}
          onError={() => {
            setPlaying(false);
            setAudioStatus("真实音频：文件未找到，请放入授权音频");
          }}
        />
        <div className={`winamp-eq ${playing ? "playing" : ""}`}>
          {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--bar": `${20 + ((index * 17 + track * 9) % 70)}%` } as CSSProperties} />)}
        </div>
        <div className="winamp-controls">
          <button onClick={() => step(-1)}>◀◀</button>
          <button onClick={start}>▶</button>
          <button onClick={pause}>▮▮</button>
          <button onClick={() => step(1)}>▶▶</button>
        </div>
        <label className="winamp-volume">VOL <input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></label>
      </section>
      <section className="winamp-list">
        <h3>PLAYLIST</h3>
        <p>{sourceState}</p>
        <button className="winamp-refresh" onClick={loadTracks}>刷新 YYMP3 榜单</button>
        {tracks.map((item, index) => (
          <button key={`${item.title}-${index}`} className={index === track ? "active" : ""} onClick={() => chooseTrack(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{item.title}</b>
            <small>{item.audioSrc ? `${item.artist} · 本地音频` : `${item.artist} · 缺音频`}</small>
          </button>
        ))}
        {tracks[track]?.url && <a href={tracks[track].url} target="_blank" rel="noreferrer">打开原榜单/歌曲页</a>}
      </section>
    </div>
  );
}

function MarsPanel() {
  const addPost = useGame((state) => state.addPost);
  const [text, setText] = useState("我爱QQ2009");
  const [result, setResult] = useState("✧ 偶嗳QQ2009 ✧\no(≧v≦)o ♡゜");
  const decorate = (value: string) => {
    const source = value.trim() || "我爱QQ2009";
    return `✧ ${toMars(source)} ✧\no(≧v≦)o ♡゜`;
  };
  const insert = (token: string) => {
    setText((current) => `${current}${token}`);
  };
  const commonSymbols = ["^_^", "(≧ω≦)", "o(≧v≦)o", "☆", "♡", "♪", "o_o", "~~", ">_<", "｡◕‿◕｡"];
  const decorations = ["★☆", "❀❀", "♡♡", "☼☾", "✧✧", "•••", "~^.^~", "°•☆•°", "~(≧▽≦)~", "^3^"];

  return (
    <div className="mars-panel">
      <header className="mars-title">
        <div className="mars-penguin" />
        <div>
          <h2>火星文生成器</h2>
          <p>（≧ω≦）萌萌滴火星文！</p>
        </div>
      </header>
      <section className="mars-editor">
        <label>输入文字：</label>
        <textarea value={text} maxLength={100} onChange={(event) => setText(event.target.value)} />
        <span>已输入：{text.length}/100</span>
        <button className="mars-primary" onClick={() => setResult(decorate(text))}>★ 一键转换</button>
      </section>
      <section className="mars-editor">
        <label>转换结果：</label>
        <textarea value={result} onChange={(event) => setResult(event.target.value)} />
        <div className="mars-actions">
          <button onClick={() => navigator.clipboard?.writeText(result)}>复制</button>
          <button onClick={() => addPost(result)}>分享</button>
          <button onClick={() => { setText(""); setResult(""); }}>清空</button>
        </div>
      </section>
      <section className="mars-token-section">
        <h3>常用符号</h3>
        <div>{commonSymbols.map((item) => <button key={item} onClick={() => insert(item)}>{item}</button>)}</div>
      </section>
      <section className="mars-token-section">
        <h3>个性装饰</h3>
        <div>{decorations.map((item) => <button key={item} onClick={() => insert(item)}>{item}</button>)}</div>
      </section>
    </div>
  );
}

function FamilyPanel() {
  const nick = useGame((state) => state.nick);
  const familyRank = useGame((state) => state.familyRank);
  const adminPower = useGame((state) => state.adminPower);
  const day = useGame((state) => state.day);
  const groupLines = useGame((state) => state.groupLines);
  const members = useGame((state) => state.groupMembers);
  const groupAlias = useGame((state) => state.groupAlias);
  const groupNotice = useGame((state) => state.groupNotice);
  const sendGroupSpeech = useGame((state) => state.sendGroupSpeech);
  const updateGroupAlias = useGame((state) => state.updateGroupAlias);
  const setGroupNotice = useGame((state) => state.setGroupNotice);
  const runGroupAction = useGame((state) => state.runGroupAction);
  const openApp = useGame((state) => state.openApp);
  const sleepToNextDay = useGame((state) => state.sleepToNextDay);
  const plan = getDayPlan(day);
  const [speech, setSpeech] = useState("别哭，家族永远是你的避风港");
  const [alias, setAlias] = useState(groupAlias || "ζั͡葬爱✾冷少灬殇");
  const [notice, setNotice] = useState(groupNotice);
  const [target, setTarget] = useState(members[0]?.name ?? "失恋の小雨");
  const submitSpeech = (event: FormEvent) => {
    event.preventDefault();
    sendGroupSpeech(speech);
    setSpeech("");
  };
  const submitAlias = (event: FormEvent) => {
    event.preventDefault();
    updateGroupAlias(alias);
  };
  const submitNotice = (event: FormEvent) => {
    event.preventDefault();
    setGroupNotice(notice);
  };

  return (
    <div className="family-panel group-sim">
      <header>
        <h2>葬AI家族群</h2>
        <p>Day {day} · {nick} · {familyRank} · {powerLabel(adminPower, familyRank)}</p>
      </header>
      <section className="day-loop-panel" aria-label="七天游戏循环">
        <div className="day-loop-title">
          <b>{plan.act}</b>
          <h3>Day {day}：{plan.title}</h3>
          <p>{plan.mood} · 身份：{plan.identity}</p>
        </div>
        <ol>
          {plan.loop.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="day-goals">
          {plan.goals.map((goal) => <span key={goal}>{goal}</span>)}
        </div>
        <menu>
          <button type="button" onClick={() => openApp("qq")}>QQ上线</button>
          <button type="button" onClick={() => openApp("space")}>空间曝光</button>
          <button type="button" onClick={() => openApp("family")}>处理事件</button>
          <button type="button" onClick={sleepToNextDay}>{day >= 7 ? "最终任命" : "睡觉"}</button>
        </menu>
        <small>22:00 · System：{plan.systemHint}</small>
      </section>
      <section className="group-main">
        <div className="group-chat-feed">
          {groupLines.map((line, index) => (
            <article key={`${line.from}-${line.time}-${index}`} className={line.system ? "system" : ""}>
              <b>{line.from}</b>
              <p>{line.text}</p>
              <small>{line.time}</small>
            </article>
          ))}
        </div>
        <aside className="group-members">
          <h3>成员列表</h3>
          {members.map((member) => (
            <button key={member.name} className={target === member.name ? "active" : ""} onClick={() => setTarget(member.name)}>
              <b>{member.name}</b>
              <span>{member.role} · {favorLabel(member.favor)}</span>
            </button>
          ))}
        </aside>
      </section>
      <section className="group-actions">
        <form onSubmit={submitSpeech}>
          <label>打字发言</label>
          <input value={speech} onChange={(event) => setSpeech(event.target.value)} placeholder="输入葬爱语录、安慰、拉票或拱火..." />
          <button type="submit">发送</button>
        </form>
        <form onSubmit={submitAlias}>
          <label>限时改马甲 <span>{aliasTemplate}</span></label>
          <input value={alias} onChange={(event) => setAlias(event.target.value)} />
          <button type="submit">提交马甲</button>
        </form>
        <form onSubmit={submitNotice}>
          <label>编辑群公告</label>
          <input value={notice} onChange={(event) => setNotice(event.target.value)} />
          <button type="submit">改公告</button>
        </form>
        <div className="group-admin-actions">
          {["私聊帮主", "拉票", "拉小群", "禁言", "踢人", "改头衔"].map((action) => (
            <button key={action} onClick={() => runGroupAction(action, target)}>{action}</button>
          ))}
        </div>
      </section>
    </div>
  );
}

function NetbarPanel() {
  const addEvent = useGame((state) => state.addEvent);
  const places = [
    ["前台", "网吧前台：老板问你续不续黄钻"],
    ["电脑", "12号机：QQ滴滴声响起"],
    ["泡面", "泡面区：加蛋需要 3Q币"],
    ["厕所", "厕所：老师巡查时的临时避难点"],
    ["情侣区", "情侣区：空间情侣关系出现裂缝"],
    ["大神区", "大神区：有人正在刷劲舞团"],
  ];
  return (
    <div className="netbar-panel zai-panel">
      <header className="zai-panel-hero">
        <i className="zai-glyph ie" />
        <div>
          <h2>风云网吧地图</h2>
          <p>每个区域都是可点击事件，会写入日志并影响后续叙事。</p>
        </div>
      </header>
      <section className="netbar-map">
        {places.map(([place, event]) => <button key={place} onClick={() => addEvent(event)}><b>{place}</b><span>{event}</span></button>)}
      </section>
      <section className="zai-action-grid">
        <button onClick={() => addEvent("你躲进厕所，班主任巡查失败")}>老师来了：躲</button>
        <button onClick={() => addEvent("妈妈拔网线：屏幕进入黑屏断线")}>妈妈来了：断线预警</button>
      </section>
    </div>
  );
}

function WechatPanel() {
  const nick = useGame((state) => state.nick);
  const messages = useGame((state) => state.wechatMessages);
  const moments = useGame((state) => state.moments);
  const sendWechat = useGame((state) => state.sendWechat);
  const [loggedIn, setLoggedIn] = useState(false);
  const [wechatName, setWechatName] = useState(nick);
  const [accepted, setAccepted] = useState(false);
  const [text, setText] = useState("");
  const login = (event: FormEvent) => {
    event.preventDefault();
    if (!wechatName.trim() || !accepted) return;
    setLoggedIn(true);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    sendWechat(text);
    setText("");
  };

  if (!loggedIn) {
    return (
      <form className="wechat-login" onSubmit={login}>
        <div className="wechat-pixel-phone">
          <div className="wechat-logo-pixel">
            <i />
            <b />
          </div>
          <span>WeChat 2009</span>
        </div>
        <section className="wechat-login-card">
          <h2>微信登录</h2>
          <p>未来通讯模块 · 独立同步</p>
          <label>
            昵称
            <input value={wechatName} onChange={(event) => setWechatName(event.target.value)} placeholder="输入微信昵称" />
          </label>
          <button className={`wechat-check ${accepted ? "active" : ""}`} type="button" onClick={() => setAccepted((value) => !value)}>
            <i>{accepted ? "✓" : ""}</i><span>我已确认这不是 QQ 聊天记录</span>
          </button>
          <button className="wechat-login-button" type="submit" disabled={!wechatName.trim() || !accepted}>登录微信</button>
        </section>
      </form>
    );
  }

  return (
    <div className="wechat-panel">
      <header>
        <h2>微信 · {wechatName}</h2>
        <p>独立模块：消息同步到 wechat，不写入 QQ 聊天。</p>
      </header>
      <div className="wechat-list">
        {moments.map((moment, index) => (
          <div key={`${moment.time}-${index}`} className="moment">
            <small>朋友圈 {moment.time}</small>
            <p>{moment.caption}</p>
            <img src={moment.image} alt="朋友圈大头贴" />
          </div>
        ))}
        {messages.map((message, index) => (
          <div key={`${message.time}-${index}`} className={message.from === "me" ? "me" : ""}>
            <small>{message.from === "me" ? "我" : "微信"} {message.time}</small>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="输入微信消息..." />
        <button type="submit">发送</button>
      </form>
    </div>
  );
}

function ArchaeologyBrowser() {
  const runScan = useGame((state) => state.runScan);
  const addEvent = useGame((state) => state.addEvent);
  return (
    <div className="ie-panel zai-panel">
      <header className="zai-panel-hero">
        <i className="zai-glyph ie" />
        <div>
          <h2>Internet Explorer - 互联网考古</h2>
          <p>把 XP、QQ2009、QQ空间资料整理成可触发的像素线索。</p>
        </div>
      </header>
      <section className="zai-action-grid">
        {[
          ["扫描 QQ2009", "联网考古：QQ2009 好友栏目浮现"],
          ["扫描 QQ空间", "联网考古：QQ空间留言板浮现"],
          ["扫描 XP 桌面", "联网考古：XP 图标体系浮现"],
        ].map(([label, event]) => (
          <button key={label} onClick={() => {
            addEvent(event);
            runScan();
          }}>{label}</button>
        ))}
      </section>
      <ArchaeologyFloat />
    </div>
  );
}

function NotepadPanel() {
  return (
    <div className="notepad-panel zai-panel">
      <header className="zai-panel-hero">
        <i className="zai-glyph note" />
        <div>
          <h2>记事本</h2>
          <p>网吧包夜开发日志。</p>
        </div>
      </header>
      <textarea className="notepad" defaultValue={"葬AI家族模拟器开发日志：\n1. XP开机\n2. 桌面图标\n3. QQ2009聊天\n4. QQ空间回踩\n5. 大头贴传播\n6. 群公告、马甲、管理权限\n7. Q币、黄钻、刷评论"} />
    </div>
  );
}

function ShortcutPanel({ id, title }: { id: WindowId; title: string }) {
  const openApp = useGame((state) => state.openApp);
  const addEvent = useGame((state) => state.addEvent);
  const target = shortcutTarget[id] ?? "qq";
  const icon = desktopIcons.find((item) => item.id === id);
  const actions = shortcutActions[id] ?? [
    ["写入日志", `${title}：桌面组件已被点击`],
    ["同步到后端", `${title}：模块状态已同步`],
  ];

  return (
    <div className="shortcut-panel zai-panel">
      <header className="zai-panel-hero">
        {icon && <img src={`/desktop-icons/${icon.file}?v=${desktopIconVersion}`} alt="" />}
        <div>
          <h2>{title}</h2>
          <p>{shortcutCopy[id] ?? "这个桌面组件已接入原有玩法入口。"}</p>
        </div>
      </header>
      <section className="shortcut-visual">
        <div className={`shortcut-pixel ${id}`}><i /><b>{title}</b><span>2009.exe</span></div>
        <ul>
          <li>像素 UI 已统一</li>
          <li>点击会写入游戏日志</li>
          <li>可跳转到相关玩法模块</li>
        </ul>
      </section>
      <section className="zai-action-grid">
        <button onClick={() => openApp(target)}>打开相关模块</button>
        {actions.map(([label, event]) => <button key={label} onClick={() => addEvent(event)}>{label}</button>)}
      </section>
    </div>
  );
}

const shortcutTarget: Partial<Record<WindowId, WindowId>> = {
  computer: "qq",
  docs: "notepad",
  trash: "qq",
  music: "space",
  farm: "space",
  ranch: "space",
  games: "family",
  mail: "qq",
  calendar: "family",
  search: "ie",
  help: "ie",
  storm: "space",
  mobileqq: "qq",
  burn: "photo",
  redDiamond: "show",
  greenDiamond: "space",
  yellowDiamond: "space",
  superVip: "show",
  vipCenter: "show",
  winrar: "family",
  pcManager: "netbar",
};

const shortcutCopy: Partial<Record<WindowId, string>> = {
  computer: "系统入口。查看这台网吧机器里最重要的社交资产。",
  docs: "文档入口。跳到记事本查看包夜开发日志。",
  wechat: "未来软件。和 QQ 分开同步，不混进 QQ 聊天。",
  trash: "回收站。找回被删掉的伤感语录和旧头像。",
  music: "音乐入口。把空间 BGM 氛围推给 QQ空间。",
  farm: "QQ农场。当前版本作为空间访客经济的分支入口。",
  ranch: "QQ牧场。当前版本作为空间互动和偷看记录入口。",
  games: "游戏中心。相关目标由葬AI家族群任务承载。",
  mail: "邮箱入口。查看独立的 QQ邮箱收件箱。",
  calendar: "日历入口。查看家族七天流程和公告节奏。",
  search: "搜索入口。进入联网考古，把资料变成游戏线索。",
  help: "帮助入口。查看系统风险和玩法提示。",
  storm: "影音入口。把伤感音乐写入空间氛围。",
  mobileqq: "手机 QQ。用于移动端登录和取回密码叙事。",
  burn: "刻录入口。把大头贴照片保存成传播素材。",
  redDiamond: "红钻入口。连接 QQ秀换装和红钻排面。",
  greenDiamond: "绿钻入口。连接空间音乐和背景音乐排面。",
  yellowDiamond: "黄钻入口。连接 QQ空间装扮和刷评论经济。",
  superVip: "超级会员。连接 QQ秀展示和身份排面。",
  vipCenter: "会员中心。查看红钻、黄钻、绿钻相关入口。",
  winrar: "压缩包。把家族资料打包成内战证据。",
  pcManager: "电脑管家。连接网吧风险、断线和扫描事件。",
};

const shortcutActions: Partial<Record<WindowId, [string, string][]>> = {
  computer: [["扫描硬盘", "我的电脑：发现 QQ聊天记录缓存"], ["查看用户", "我的电脑：Administrator 正在加载个人设置"]],
  trash: [["恢复头像", "回收站：恢复一张非主流头像"], ["清空风险", "回收站：系统风险提示暂时消失"]],
  music: [["设为空间BGM", "QQ音乐：空间背景音乐已更换"], ["循环播放", "QQ音乐：伤感曲目循环中"]],
  farm: [["偷菜记录", "QQ农场：访客记录 +1"], ["浇水回踩", "QQ农场：回踩关系升温"]],
  ranch: [["喂牧场", "QQ牧场：好友访问记录增加"], ["偷看牧场", "QQ牧场：疑似小号出现"]],
  calendar: [["安排统一马甲", "日历：今晚八点统一马甲"], ["记录选举日", "日历：管理员选举进入倒计时"]],
  help: [["查看帮助", "帮助：玩法提示已打开"], ["系统修复", "帮助：系统提示你先登录 QQ"]],
  storm: [["播放 MV", "暴风影音：伤感 MV 已播放"], ["截图发空间", "暴风影音：截图准备发到空间"]],
  mobileqq: [["手机验证", "手机QQ：验证码流程已准备"], ["同步在线", "手机QQ：移动端在线状态同步"]],
  burn: [["刻录大头贴", "刻录光盘：大头贴已写入光盘"], ["备份相册", "刻录光盘：空间相册已备份"]],
  greenDiamond: [["开通绿钻", "绿钻：空间音乐排面提升"], ["试听歌曲", "绿钻：试听 Linkin Park"]],
  yellowDiamond: [["续费黄钻", "黄钻：空间装扮排面提升"], ["刷访客", "黄钻：访客互动预热"]],
  superVip: [["点亮身份", "超级会员：身份图标闪烁"], ["同步 QQ秀", "超级会员：QQ秀侧栏更新"]],
  vipCenter: [["查看权益", "会员中心：红钻黄钻绿钻权益展开"], ["领取礼包", "会员中心：获得随机装扮券"]],
  winrar: [["解压证据", "WinRAR：解压出小群聊天截图"], ["加密资料", "WinRAR：家族资料已加密"]],
  pcManager: [["病毒扫描", "电脑管家：检测到 QQ盗号风险"], ["断网保护", "电脑管家：网吧风险已记录"]],
};

function FriendsPanel() {
  const setActiveNpc = useGame((state) => state.setActiveNpc);
  return (
    <div className="friends-panel zai-panel">
      <header className="zai-panel-hero">
        <i className="zai-glyph log" />
        <div>
          <h2>我的好友</h2>
          <p>从这里进入对应 NPC 聊天，保持和 QQ 主线一致。</p>
        </div>
      </header>
      {(Object.keys(npcs) as NpcId[]).map((id) => (
        <button key={id} onClick={() => setActiveNpc(id)}>
          <span>{npcs[id].avatar}</span>
          <b>{npcs[id].name}</b>
          <small>{npcs[id].signature}</small>
        </button>
      ))}
    </div>
  );
}

function SystemBubble() {
  return <aside className="system-bubble"><button>×</button><b>来自系统消息</b><p>您的电脑可能存在风险。建议立即进行病毒扫描。</p></aside>;
}

function Taskbar() {
  const openWindow = useGame((state) => state.openWindow);
  const streamCommand = useGame((state) => state.streamCommand);
  return <footer className="xp-taskbar"><button>开始</button><span>{openWindow ? `${openWindow}.exe` : "QQ - 好友列表"}</span><div className="quick-danmaku">{["踩踩", "黄钻", "老师来了", "妈妈来了", "emo", "大头贴"].map((item) => <button key={item} onClick={() => streamCommand(item)}>{item}</button>)}</div><time>CH  ?  🔊  20:09</time></footer>;
}
