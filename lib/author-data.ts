/**
 * E-E-A-T 作者档案数据
 *
 * 提供作者信息用于博客署名、结构化数据和信任信号。
 * 支持多语言（en/zh），其他语言 fallback 到英文。
 */

import type { BlogPost } from './blog-data';

/**
 * 作者档案接口
 */
export interface AuthorProfile {
  readonly id: string;
  readonly name: { readonly en: string; readonly zh: string };
  readonly role: { readonly en: string; readonly zh: string };
  readonly bio: { readonly en: string; readonly zh: string };
  readonly credentials: ReadonlyArray<string>;
  readonly avatar: string;
  readonly social?: {
    readonly linkedin?: string;
    readonly email?: string;
  };
}

/**
 * 作者档案数据
 */
export const AUTHORS: ReadonlyArray<AuthorProfile> = [
  {
    id: 'jay',
    name: {
      en: 'Jay Li',
      zh: 'Jay Li',
    },
    role: {
      en: 'Founder & CEO',
      zh: '创始人兼首席执行官',
    },
    bio: {
      en: 'Jay Li leads Better Bags Myanmar with 20+ years of backpack manufacturing expertise. A graduate of Penn State University and Harrisburg University of Science and Technology, he brings proven international experience and cross-cultural communication skills to every partnership.',
      zh: 'Jay Li 以超过20年的背包制造专业经验领导 Better Bags Myanmar。毕业于宾夕法尼亚州立大学和哈里斯堡科技大学，为每一个合作伙伴带来经过验证的国际经验和跨文化沟通能力。',
    },
    credentials: [
      'Penn State University',
      'Harrisburg University of Science and Technology',
      '20+ Years Manufacturing Experience',
    ],
    avatar: '/images/team/jay-li.jpg',
    social: {
      email: 'jay@biteerbags.com',
    },
  },
  {
    id: 'better-bags-team',
    name: {
      en: 'Better Bags Team',
      zh: 'Better Bags 团队',
    },
    role: {
      en: 'Editorial Team',
      zh: '编辑团队',
    },
    bio: {
      en: 'The Better Bags Myanmar editorial team shares industry insights and manufacturing expertise from our ISO 9001 certified factory with 800+ professional employees.',
      zh: 'Better Bags Myanmar 编辑团队分享来自我们 ISO 9001 认证工厂的行业见解和制造专业知识，拥有800多名专业员工。',
    },
    credentials: [
      'ISO 9001 Certified Factory',
      'OEKO-TEX Standard 100',
    ],
    avatar: '/images/team/better-bags-team.jpg',
  },
] as const;

/**
 * 根据 ID 获取作者档案
 */
export function getAuthorById(id: string): AuthorProfile | undefined {
  return AUTHORS.find((author) => author.id === id);
}

/**
 * 根据博客文章获取对应的作者档案
 * 通过 authorId 映射，fallback 到 better-bags-team
 */
export function getAuthorForPost(post: BlogPost): AuthorProfile {
  if (post.authorId) {
    const author = getAuthorById(post.authorId);
    if (author) {
      return author;
    }
  }
  // fallback 到 better-bags-team
  return AUTHORS[1];
}

/**
 * 估算阅读时间（分钟）
 * 基于每分钟 200 词的阅读速度
 */
export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
