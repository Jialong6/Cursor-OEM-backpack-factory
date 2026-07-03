/**
 * E-E-A-T 作者档案数据
 *
 * 提供作者信息用于博客署名、结构化数据和信任信号。
 * name/role/bio 覆盖全部 12 种 locale(Record<Locale, string>,
 * TS 强制新增语言时同步补齐);bio 译文与站点 UI 翻译同源。
 */

import type { Locale } from '@/i18n';
import type { BlogPost } from './blog-data';

/** 全语言文本:每个受支持 locale 一份 */
export type AuthorLocalizedText = Record<Locale, string>;

/**
 * 作者档案接口
 */
export interface AuthorProfile {
  readonly id: string;
  readonly name: AuthorLocalizedText;
  readonly role: AuthorLocalizedText;
  readonly bio: AuthorLocalizedText;
  readonly credentials: ReadonlyArray<string>;
  readonly avatar: string;
  readonly social?: {
    readonly linkedin?: string;
    readonly email?: string;
  };
}

const JAY_NAME: AuthorLocalizedText = {
  en: 'Jay Li', zh: 'Jay Li', ja: 'Jay Li', de: 'Jay Li', nl: 'Jay Li',
  fr: 'Jay Li', pt: 'Jay Li', es: 'Jay Li', 'zh-tw': 'Jay Li', ru: 'Jay Li',
  my: 'Jay Li', ko: 'Jay Li',
};

const TEAM_NAME: AuthorLocalizedText = {
  en: 'Better Bags Team',
  zh: 'Better Bags 团队',
  ja: 'Better Bags チーム',
  de: 'Better Bags Team',
  nl: 'Better Bags Team',
  fr: 'Équipe Better Bags',
  pt: 'Equipe Better Bags',
  es: 'Equipo Better Bags',
  'zh-tw': 'Better Bags 團隊',
  ru: 'Команда Better Bags',
  my: 'Better Bags အဖွဲ့',
  ko: 'Better Bags 팀',
};

/**
 * 作者档案数据
 */
export const AUTHORS: ReadonlyArray<AuthorProfile> = [
  {
    id: 'jay',
    name: JAY_NAME,
    role: {
      en: 'Business Development Manager',
      zh: '业务发展经理',
      ja: '事業開発マネージャー',
      de: 'Business Development Manager',
      nl: 'Business Development Manager',
      fr: 'Responsable du développement commercial',
      pt: 'Gerente de Desenvolvimento de Negócios',
      es: 'Gerente de Desarrollo de Negocios',
      'zh-tw': '業務發展經理',
      ru: 'Менеджер по развитию бизнеса',
      my: 'စီးပွားရေးဖွံ့ဖြိုးတိုးတက်မှု မန်နေဂျာ',
      ko: '사업 개발 매니저',
    },
    bio: {
      en: 'As the next-generation leader of Better Bags — a family-owned manufacturer with global vision — I draw upon more than 8 years of study and professional experience in Pennsylvania, United States. Being an alumnus of Penn State University and Carnegie Mellon University, I am proud to bring proven international expertise as well as cross-cultural communication skills to our clients and partners. My mission is to bridge the best of East and West, ensuring every partner enjoys premium products, seamless project communication, and reliable after-sales support — no matter where you are in the world.',
      zh: '作为 Better Bags 新一代的领航者——一家兼具全球视野的家族制造企业——我汲取了在美国宾夕法尼亚州逾 8 年的求学与职业经验。身为宾夕法尼亚州立大学与卡内基梅隆大学的校友，我很自豪能为客户与合作伙伴带来经过验证的国际专业能力与跨文化沟通能力。我的使命是融汇东西方之长，让每一位伙伴无论身在世界何处，都能享有优质的产品、顺畅的项目沟通与可靠的售后支持。',
      ja: 'グローバルな視野を持つ家族経営メーカー、Better Bags の次世代を担う者として、私は米国ペンシルベニア州での 8 年以上にわたる学業と実務経験を礎としています。Penn State University と Carnegie Mellon University の卒業生として、実証された国際的な専門性と異文化コミュニケーション力をお客様やパートナーの皆さまにお届けできることを誇りに思います。私の使命は、東洋と西洋それぞれの強みを結びつけ、世界のどこにいらっしゃるお客様にも、優れた製品・スムーズなプロジェクト進行・確かなアフターサポートをお届けすることです。',
      de: 'Als Vertreter der nächsten Generation an der Spitze von Better Bags, einem familiengeführten Hersteller mit internationaler Ausrichtung, stütze ich mich auf mehr als 8 Jahre Studien- und Berufserfahrung in Pennsylvania, USA. Als Absolvent von Penn State University und Carnegie Mellon University bringe ich nachweisliche internationale Expertise sowie interkulturelle Kommunikationskompetenz in die Zusammenarbeit mit unseren Kunden und Partnern ein. Mein Anliegen ist es, die Stärken von Ost und West zu verbinden: hochwertige Produkte, reibungslose Projektkommunikation und verlässlicher After-Sales-Support für jeden Partner, ganz gleich, wo auf der Welt Sie tätig sind.',
      nl: 'Als leider van de nieuwe generatie bij Better Bags — een familiebedrijf met een wereldwijde visie — bouw ik voort op meer dan 8 jaar studie en werkervaring in Pennsylvania, Verenigde Staten. Als alumnus van Penn State University en Carnegie Mellon University breng ik bewezen internationale expertise en interculturele communicatievaardigheden mee voor onze klanten en partners. Mijn missie is het beste van Oost en West te verbinden, zodat elke partner kan rekenen op hoogwaardige producten, soepele projectcommunicatie en betrouwbare after-sales support — waar ter wereld u ook bent.',
      fr: "En tant que dirigeant de la nouvelle génération de Better Bags — fabricant familial porté par une vision internationale —, je m'appuie sur plus de 8 années d'études et d'expérience professionnelle en Pennsylvanie, aux États-Unis. Diplômé de Penn State University et de Carnegie Mellon University, je suis fier d'apporter à nos clients et partenaires une expertise internationale éprouvée ainsi que de solides compétences en communication interculturelle. Ma mission : réunir le meilleur de l'Orient et de l'Occident, afin que chaque partenaire bénéficie de produits haut de gamme, d'une communication de projet fluide et d'un service après-vente fiable — où que vous soyez dans le monde.",
      pt: 'Como líder da nova geração da Better Bags — um fabricante familiar com visão global —, trago mais de 8 anos de estudos e experiência profissional na Pensilvânia, Estados Unidos. Como ex-aluno da Penn State University e da Carnegie Mellon University, tenho orgulho de oferecer aos nossos clientes e parceiros uma expertise internacional comprovada e habilidades de comunicação intercultural. Minha missão é unir o melhor do Oriente e do Ocidente, garantindo a cada parceiro produtos premium, comunicação fluida durante todo o projeto e um suporte pós-venda confiável — onde quer que sua empresa esteja.',
      es: 'Como líder de la nueva generación de Better Bags —un fabricante familiar con visión global—, cuento con más de 8 años de estudios y experiencia profesional en Pensilvania, Estados Unidos. Como exalumno de Penn State University y Carnegie Mellon University, me enorgullece aportar a nuestros clientes y socios una experiencia internacional comprobada y habilidades de comunicación intercultural. Mi misión es unir lo mejor de Oriente y Occidente, para que cada socio disfrute de productos de primera calidad, una comunicación fluida en cada proyecto y un servicio posventa confiable, sin importar en qué parte del mundo se encuentren.',
      'zh-tw': '身為 Better Bags 的新一代領導者——一家具備全球視野的家族後背包製造商——我在美國賓夕法尼亞州累積了超過 8 年的求學與工作經歷。作為 Penn State University 與 Carnegie Mellon University 的校友，我很榮幸能為客戶與合作夥伴帶來成熟的國際專業知識與跨文化溝通能力。我的使命是結合東西方的優勢，讓全球每一位合作夥伴都能享有優質產品、順暢溝通與可靠的售後服務。',
      ru: 'Как руководитель нового поколения Better Bags — семейной производственной компании с глобальным видением — я опираюсь на более чем 8 лет учебы и профессиональной работы в штате Пенсильвания (США). Будучи выпускником Penn State University и Carnegie Mellon University, я привношу в работу с клиентами и партнерами подтвержденный международный опыт и навыки межкультурной коммуникации. Моя задача — соединять лучшие практики Востока и Запада, чтобы каждый партнер получал продукцию премиального качества, четкую коммуникацию по проекту и надежную послепродажную поддержку — в какой бы точке мира вы ни находились.',
      my: 'ကမ္ဘာ့အဆင့်မီ အမြင်ရှိသော မိသားစုပိုင် ထုတ်လုပ်သူ Better Bags ၏ မျိုးဆက်သစ် ခေါင်းဆောင်တစ်ဦးအနေဖြင့်၊ အမေရိကန်ပြည်ထောင်စု Pennsylvania ပြည်နယ်တွင် 8 နှစ်ကျော်ကြာ သင်ယူလေ့လာခဲ့သော ပညာရေးနှင့် လုပ်ငန်းခွင် အတွေ့အကြုံများကို အသုံးချလျက်ရှိပါသည်။ ကျွန်တော်သည် Penn State University နှင့် Carnegie Mellon University တို့မှ ကျောင်းဆင်းတစ်ဦးဖြစ်သည့်အားလျော်စွာ၊ ကျွန်ုပ်တို့၏ ဖောက်သည်များနှင့် မိတ်ဖက်များအတွက် နိုင်ငံတကာအဆင့်မီ ကျွမ်းကျင်မှုများနှင့် ယဉ်ကျေးမှုပေါင်းစုံ ဆက်သွယ်ရေးစွမ်းရည်များကို ယူဆောင်လာနိုင်သည့်အတွက် ဂုဏ်ယူဝမ်းမြောက်မိပါသည်။ ကျွန်တော့်၏ ရည်မှန်းချက်မှာ အရှေ့တိုင်းနှင့် အနောက်တိုင်းတို့၏ အကောင်းဆုံးအရာများကို ပေါင်းကူးပေးရန်ဖြစ်ပြီး၊ သင်သည် ကမ္ဘာ့မည်သည့်နေရာတွင်ရှိနေပါစေ၊ မိတ်ဖက်တိုင်းအတွက် အရည်အသွေးမြင့် ထုတ်ကုန်များ၊ ချောမွေ့သော ပရောဂျက်ဆက်သွယ်မှုများနှင့် ယုံကြည်စိတ်ချရသော ရောင်းချပြီးနောက်ပိုင်း ဝန်ဆောင်မှုများကို ရရှိခံစားနိုင်စေရန် သေချာစေရေးပင် ဖြစ်ပါသည်။',
      ko: '글로벌 비전을 갖춘 가족 경영 제조업체 Better Bags의 차세대 리더로서, 저는 미국 펜실베이니아에서 8년 이상 수학하며 실무 경험을 쌓았습니다. Penn State University 및 Carnegie Mellon University 동문으로서, 검증된 국제 비즈니스 전문성과 문화 간 커뮤니케이션 역량을 고객과 파트너 여러분께 제공합니다. 동서양의 강점을 잇는 가교가 되어, 전 세계 어디에 계시든 모든 파트너가 프리미엄 제품, 원활한 프로젝트 커뮤니케이션, 신뢰할 수 있는 사후 지원을 누리실 수 있도록 하는 것이 저의 사명입니다.',
    },
    credentials: [
      '8+ Years in the U.S.',
    ],
    avatar: '/images/team/jay-li.jpg',
    social: {
      email: 'jay@betterbagsmm.com',
    },
  },
  {
    id: 'better-bags-team',
    name: TEAM_NAME,
    role: {
      en: 'Editorial Team',
      zh: '编辑团队',
      ja: '編集チーム',
      de: 'Redaktionsteam',
      nl: 'Redactieteam',
      fr: 'Équipe éditoriale',
      pt: 'Equipe editorial',
      es: 'Equipo editorial',
      'zh-tw': '編輯團隊',
      ru: 'Редакция',
      my: 'အယ်ဒီတာအဖွဲ့',
      ko: '편집팀',
    },
    bio: {
      en: 'The Better Bags Myanmar editorial team shares industry insights and manufacturing expertise from our ISO 9001 certified factory with 600+ professional employees.',
      zh: 'Better Bags Myanmar 编辑团队分享来自我们 ISO 9001 认证工厂的行业见解和制造专业知识，拥有600多名专业员工。',
      ja: 'Better Bags Myanmar の編集チームが、ISO 9001 認証を取得し 600 名以上の専門スタッフを擁する当社工場から、業界のインサイトと製造のノウハウをお届けします。',
      de: 'Das Redaktionsteam von Better Bags Myanmar teilt Branchenwissen und Fertigungs-Know-how aus unserer ISO-9001-zertifizierten Fabrik mit über 600 Fachkräften.',
      nl: 'Het redactieteam van Better Bags Myanmar deelt branche-inzichten en productie-expertise vanuit onze ISO 9001-gecertificeerde fabriek met 600+ professionele medewerkers.',
      fr: "L'équipe éditoriale de Better Bags Myanmar partage analyses sectorielles et expertise de fabrication depuis notre usine certifiée ISO 9001, forte de plus de 600 collaborateurs.",
      pt: 'A equipe editorial da Better Bags Myanmar compartilha insights do setor e expertise de fabricação a partir da nossa fábrica certificada ISO 9001, com mais de 600 profissionais.',
      es: 'El equipo editorial de Better Bags Myanmar comparte conocimientos del sector y experiencia de fabricación desde nuestra fábrica certificada ISO 9001 con más de 600 empleados profesionales.',
      'zh-tw': 'Better Bags Myanmar 編輯團隊分享來自我們 ISO 9001 認證工廠的產業洞察與製造專業知識，工廠擁有 600 多名專業員工。',
      ru: 'Редакция Better Bags Myanmar делится отраслевой аналитикой и производственной экспертизой нашей фабрики с сертификатом ISO 9001 и штатом 600+ специалистов.',
      my: 'ISO 9001 အသိအမှတ်ပြုလက်မှတ် ရရှိထားပြီး ဝန်ထမ်း 600+ ရှိသော ကျွန်ုပ်တို့စက်ရုံမှ လုပ်ငန်းနယ်ပယ် ဗဟုသုတများနှင့် ထုတ်လုပ်မှုအတွေ့အကြုံများကို Better Bags Myanmar အယ်ဒီတာအဖွဲ့မှ မျှဝေပါသည်။',
      ko: 'Better Bags Myanmar 편집팀이 ISO 9001 인증을 받은 600명 이상 규모의 자사 공장에서 업계 인사이트와 제조 노하우를 전해 드립니다.',
    },
    credentials: [
      'ISO 9001 Certified Factory',
      'OEKO-TEX Standard 100',
    ],
    avatar: '/images/team/better-bags-team.jpg',
  },
] as const;

/**
 * 按 locale 取作者文本(未识别 locale 回退英文)
 */
export function getAuthorText(field: AuthorLocalizedText, locale: string): string {
  return field[locale as Locale] ?? field.en;
}

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
