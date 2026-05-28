/**
 * E-E-A-T 作者档案数据
 *
 * 提供作者信息用于博客署名、结构化数据和信任信号。
 * 支持多语言（en/zh/ja），其他语言 fallback 到英文。
 */

import type { BlogPost } from './blog-data';

/**
 * 作者档案接口
 */
export interface AuthorProfile {
  readonly id: string;
  readonly name: { readonly en: string; readonly zh: string; readonly ja: string };
  readonly role: { readonly en: string; readonly zh: string; readonly ja: string };
  readonly bio: { readonly en: string; readonly zh: string; readonly ja: string };
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
      ja: 'Jay Li',
    },
    role: {
      en: 'Business Development Manager',
      zh: '业务发展经理',
      ja: '事業開発マネージャー',
    },
    bio: {
      en: 'As the next-generation leader of Better Bags — a family-owned manufacturer with global vision — I draw upon more than 8 years of study and professional experience in Pennsylvania, United States. Being an alumnus of Penn State University and Carnegie Mellon University, I am proud to bring proven international expertise as well as cross-cultural communication skills to our clients and partners. My mission is to bridge the best of East and West, ensuring every partner enjoys premium products, seamless project communication, and reliable after-sales support — no matter where you are in the world.',
      zh: '作为 Better Bags 新一代的领航者——一家兼具全球视野的家族制造企业——我汲取了在美国宾夕法尼亚州逾 8 年的求学与职业经验。身为宾夕法尼亚州立大学与卡内基梅隆大学的校友，我很自豪能为客户与合作伙伴带来经过验证的国际专业能力与跨文化沟通能力。我的使命是融汇东西方之长，让每一位伙伴无论身在世界何处，都能享有优质的产品、顺畅的项目沟通与可靠的售后支持。',
      ja: 'グローバルな視野を持つ家族経営メーカー、Better Bags の次世代を担う者として、私は米国ペンシルベニア州での 8 年以上にわたる学業と実務経験を礎としています。Penn State University と Carnegie Mellon University の卒業生として、実証された国際的な専門性と異文化コミュニケーション力をお客様やパートナーの皆さまにお届けできることを誇りに思います。私の使命は、東洋と西洋それぞれの強みを結びつけ、世界のどこにいらっしゃるお客様にも、優れた製品・スムーズなプロジェクト進行・確かなアフターサポートをお届けすることです。',
    },
    credentials: [
      '8+ Years in the U.S.',
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
      ja: 'Better Bags チーム',
    },
    role: {
      en: 'Editorial Team',
      zh: '编辑团队',
      ja: '編集チーム',
    },
    bio: {
      en: 'The Better Bags Myanmar editorial team shares industry insights and manufacturing expertise from our ISO 9001 certified factory with 600+ professional employees.',
      zh: 'Better Bags Myanmar 编辑团队分享来自我们 ISO 9001 认证工厂的行业见解和制造专业知识，拥有600多名专业员工。',
      ja: 'Better Bags Myanmar の編集チームが、ISO 9001 認証を取得し 600 名以上の専門スタッフを擁する当社工場から、業界のインサイトと製造のノウハウをお届けします。',
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
