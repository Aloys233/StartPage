export interface SecondaryShortcutItem {
  title: string
  url: string
  note?: string
}

export interface SecondaryShortcutCategory {
  id: string
  name: string
  description: string
  items: SecondaryShortcutItem[]
}

export const secondaryShortcutCategories: SecondaryShortcutCategory[] = [
  {
    id: 'coding',
    name: '编程开发',
    description: '文档、代码托管和开发社区。',
    items: [
      { title: 'GitHub', url: 'https://github.com', note: '代码托管与协作' },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com', note: '开发问答社区' },
      { title: 'MDN', url: 'https://developer.mozilla.org', note: '前端权威文档' },
      { title: 'TypeScript', url: 'https://www.typescriptlang.org/docs/', note: 'TS 官方文档' },
      { title: 'Spring', url: 'https://spring.io/projects', note: 'Spring 生态入口' },
      { title: 'Vercel Docs', url: 'https://vercel.com/docs', note: '部署与平台文档' },
      { title: 'npm', url: 'https://www.npmjs.com', note: '包管理与检索' },
      { title: 'Can I Use', url: 'https://caniuse.com', note: '浏览器兼容查询' },
      { title: 'LeetCode', url: 'https://leetcode.com', note: '算法练习' },
      { title: 'DevDocs', url: 'https://devdocs.io', note: '聚合技术文档' },
    ],
  },
  {
    id: 'video',
    name: '视频影音',
    description: '学习、娱乐和直播平台。',
    items: [
      { title: 'YouTube', url: 'https://www.youtube.com', note: '全球视频平台' },
      { title: 'Bilibili', url: 'https://www.bilibili.com', note: '中文社区内容丰富' },
      { title: 'Twitch', url: 'https://www.twitch.tv', note: '游戏与直播' },
      { title: 'Netflix', url: 'https://www.netflix.com', note: '影视流媒体' },
      { title: '爱奇艺', url: 'https://www.iqiyi.com', note: '国产影视综艺' },
      { title: '腾讯视频', url: 'https://v.qq.com', note: '电视剧与动漫' },
      { title: 'TED', url: 'https://www.ted.com/talks', note: '演讲与知识内容' },
      { title: 'Coursera', url: 'https://www.coursera.org', note: '课程视频学习' },
      { title: '网易公开课', url: 'https://open.163.com', note: '公开课平台' },
      { title: '哔哩哔哩课堂', url: 'https://www.bilibili.com/cheese/', note: '系统课程内容' },
    ],
  },
  {
    id: 'ai',
    name: 'AI 工具',
    description: '模型应用、检索和创作平台。',
    items: [
      { title: 'ChatGPT', url: 'https://chatgpt.com', note: '通用对话与写作' },
      { title: 'Claude', url: 'https://claude.ai', note: '长文本与分析' },
      { title: 'Gemini', url: 'https://gemini.google.com', note: 'Google AI 助手' },
      { title: 'Perplexity', url: 'https://www.perplexity.ai', note: '检索增强问答' },
      { title: 'Hugging Face', url: 'https://huggingface.co', note: '模型与数据集' },
      { title: 'Replicate', url: 'https://replicate.com', note: '在线运行模型' },
      { title: 'Poe', url: 'https://poe.com', note: '多模型聊天' },
      { title: 'Midjourney', url: 'https://www.midjourney.com', note: '图像生成' },
      { title: 'ComfyUI', url: 'https://www.comfy.org', note: '工作流式生成' },
      { title: 'OpenRouter', url: 'https://openrouter.ai', note: '多模型 API 网关' },
    ],
  },
  {
    id: 'productivity',
    name: '效率办公',
    description: '任务管理、协作和知识库。',
    items: [
      { title: 'Notion', url: 'https://www.notion.so', note: '知识管理与文档' },
      { title: 'Linear', url: 'https://linear.app', note: '团队任务追踪' },
      { title: 'Jira', url: 'https://www.atlassian.com/software/jira', note: '项目与需求管理' },
      { title: 'Figma', url: 'https://www.figma.com', note: '协作设计' },
      { title: 'Excalidraw', url: 'https://excalidraw.com', note: '手绘风流程图' },
      { title: 'Google Drive', url: 'https://drive.google.com', note: '云文件协作' },
      { title: '飞书文档', url: 'https://www.feishu.cn', note: '文档与协同办公' },
      { title: '语雀', url: 'https://www.yuque.com', note: '团队知识库' },
      { title: 'Trello', url: 'https://trello.com', note: '看板式任务管理' },
      { title: 'Miro', url: 'https://miro.com', note: '在线白板协作' },
    ],
  },
]
