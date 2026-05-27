/**
 * 国家数据常量和工具函数(ISO 3166-1 alpha-2 完整列表)
 *
 * 包含约 249 个国家/地区,带 dial code(国际电话区号)。
 * 用于联系表单的国家选择器 + 电话前缀选择。
 */

export interface CountryOption {
  /** ISO 3166-1 alpha-2 国家代码 */
  code: string;
  /** 中文名称 */
  nameZh: string;
  /** 英文名称 */
  nameEn: string;
  /** 国际电话区号(含 + 前缀),如 "+86" */
  dialCode: string;
}

/**
 * 本地化国家信息(简化结构)
 */
export interface LocalizedCountry {
  code: string;
  name: string;
  dialCode: string;
}

/**
 * 热门国家代码(置顶显示)
 *
 * 取 i18n.ts 实际支持的 10 种 locale ∪ CLAUDE.md 计划支持的 10 种 locale
 * 对应的主要国家合集,加上公司所在地缅甸,共 19 个。
 * 按地理+业务重要性排序。
 */
export const POPULAR_COUNTRY_CODES: readonly string[] = Object.freeze([
  // 亚洲(含公司所在地)
  'CN', 'HK', 'TW', 'JP', 'KR', 'TH', 'VN', 'MM',
  // 欧美
  'US', 'GB', 'DE', 'NL', 'FR', 'PT', 'ES', 'RU', 'MX', 'BR',
  // 中东(代表阿拉伯语区)
  'SA',
]);

/**
 * 完整国家/地区列表(ISO 3166-1 alpha-2)
 *
 * 按英文名字母排序。
 * dialCode 数据来源:ITU-T E.164。
 * 一国多区号(如美国+加拿大共用 +1)按主用区号列出。
 */
export const COUNTRIES: readonly CountryOption[] = Object.freeze([
  { code: 'AF', nameEn: 'Afghanistan',               nameZh: '阿富汗',           dialCode: '+93'   },
  { code: 'AL', nameEn: 'Albania',                   nameZh: '阿尔巴尼亚',       dialCode: '+355'  },
  { code: 'DZ', nameEn: 'Algeria',                   nameZh: '阿尔及利亚',       dialCode: '+213'  },
  { code: 'AS', nameEn: 'American Samoa',            nameZh: '美属萨摩亚',       dialCode: '+1684' },
  { code: 'AD', nameEn: 'Andorra',                   nameZh: '安道尔',           dialCode: '+376'  },
  { code: 'AO', nameEn: 'Angola',                    nameZh: '安哥拉',           dialCode: '+244'  },
  { code: 'AI', nameEn: 'Anguilla',                  nameZh: '安圭拉',           dialCode: '+1264' },
  { code: 'AQ', nameEn: 'Antarctica',                nameZh: '南极洲',           dialCode: '+672'  },
  { code: 'AG', nameEn: 'Antigua and Barbuda',       nameZh: '安提瓜和巴布达',   dialCode: '+1268' },
  { code: 'AR', nameEn: 'Argentina',                 nameZh: '阿根廷',           dialCode: '+54'   },
  { code: 'AM', nameEn: 'Armenia',                   nameZh: '亚美尼亚',         dialCode: '+374'  },
  { code: 'AW', nameEn: 'Aruba',                     nameZh: '阿鲁巴',           dialCode: '+297'  },
  { code: 'AU', nameEn: 'Australia',                 nameZh: '澳大利亚',         dialCode: '+61'   },
  { code: 'AT', nameEn: 'Austria',                   nameZh: '奥地利',           dialCode: '+43'   },
  { code: 'AZ', nameEn: 'Azerbaijan',                nameZh: '阿塞拜疆',         dialCode: '+994'  },
  { code: 'BS', nameEn: 'Bahamas',                   nameZh: '巴哈马',           dialCode: '+1242' },
  { code: 'BH', nameEn: 'Bahrain',                   nameZh: '巴林',             dialCode: '+973'  },
  { code: 'BD', nameEn: 'Bangladesh',                nameZh: '孟加拉国',         dialCode: '+880'  },
  { code: 'BB', nameEn: 'Barbados',                  nameZh: '巴巴多斯',         dialCode: '+1246' },
  { code: 'BY', nameEn: 'Belarus',                   nameZh: '白俄罗斯',         dialCode: '+375'  },
  { code: 'BE', nameEn: 'Belgium',                   nameZh: '比利时',           dialCode: '+32'   },
  { code: 'BZ', nameEn: 'Belize',                    nameZh: '伯利兹',           dialCode: '+501'  },
  { code: 'BJ', nameEn: 'Benin',                     nameZh: '贝宁',             dialCode: '+229'  },
  { code: 'BM', nameEn: 'Bermuda',                   nameZh: '百慕大',           dialCode: '+1441' },
  { code: 'BT', nameEn: 'Bhutan',                    nameZh: '不丹',             dialCode: '+975'  },
  { code: 'BO', nameEn: 'Bolivia',                   nameZh: '玻利维亚',         dialCode: '+591'  },
  { code: 'BA', nameEn: 'Bosnia and Herzegovina',    nameZh: '波斯尼亚和黑塞哥维那', dialCode: '+387' },
  { code: 'BW', nameEn: 'Botswana',                  nameZh: '博茨瓦纳',         dialCode: '+267'  },
  { code: 'BR', nameEn: 'Brazil',                    nameZh: '巴西',             dialCode: '+55'   },
  { code: 'IO', nameEn: 'British Indian Ocean Territory', nameZh: '英属印度洋领地', dialCode: '+246' },
  { code: 'VG', nameEn: 'British Virgin Islands',    nameZh: '英属维尔京群岛',   dialCode: '+1284' },
  { code: 'BN', nameEn: 'Brunei',                    nameZh: '文莱',             dialCode: '+673'  },
  { code: 'BG', nameEn: 'Bulgaria',                  nameZh: '保加利亚',         dialCode: '+359'  },
  { code: 'BF', nameEn: 'Burkina Faso',              nameZh: '布基纳法索',       dialCode: '+226'  },
  { code: 'BI', nameEn: 'Burundi',                   nameZh: '布隆迪',           dialCode: '+257'  },
  { code: 'KH', nameEn: 'Cambodia',                  nameZh: '柬埔寨',           dialCode: '+855'  },
  { code: 'CM', nameEn: 'Cameroon',                  nameZh: '喀麦隆',           dialCode: '+237'  },
  { code: 'CA', nameEn: 'Canada',                    nameZh: '加拿大',           dialCode: '+1'    },
  { code: 'CV', nameEn: 'Cape Verde',                nameZh: '佛得角',           dialCode: '+238'  },
  { code: 'KY', nameEn: 'Cayman Islands',            nameZh: '开曼群岛',         dialCode: '+1345' },
  { code: 'CF', nameEn: 'Central African Republic',  nameZh: '中非共和国',       dialCode: '+236'  },
  { code: 'TD', nameEn: 'Chad',                      nameZh: '乍得',             dialCode: '+235'  },
  { code: 'CL', nameEn: 'Chile',                     nameZh: '智利',             dialCode: '+56'   },
  { code: 'CN', nameEn: 'China',                     nameZh: '中国',             dialCode: '+86'   },
  { code: 'CX', nameEn: 'Christmas Island',          nameZh: '圣诞岛',           dialCode: '+61'   },
  { code: 'CC', nameEn: 'Cocos (Keeling) Islands',   nameZh: '科科斯(基林)群岛', dialCode: '+61'  },
  { code: 'CO', nameEn: 'Colombia',                  nameZh: '哥伦比亚',         dialCode: '+57'   },
  { code: 'KM', nameEn: 'Comoros',                   nameZh: '科摩罗',           dialCode: '+269'  },
  { code: 'CG', nameEn: 'Congo - Brazzaville',       nameZh: '刚果(布)',         dialCode: '+242'  },
  { code: 'CD', nameEn: 'Congo - Kinshasa',          nameZh: '刚果(金)',         dialCode: '+243'  },
  { code: 'CK', nameEn: 'Cook Islands',              nameZh: '库克群岛',         dialCode: '+682'  },
  { code: 'CR', nameEn: 'Costa Rica',                nameZh: '哥斯达黎加',       dialCode: '+506'  },
  { code: 'CI', nameEn: "Côte d'Ivoire",             nameZh: '科特迪瓦',         dialCode: '+225'  },
  { code: 'HR', nameEn: 'Croatia',                   nameZh: '克罗地亚',         dialCode: '+385'  },
  { code: 'CU', nameEn: 'Cuba',                      nameZh: '古巴',             dialCode: '+53'   },
  { code: 'CW', nameEn: 'Curaçao',                   nameZh: '库拉索',           dialCode: '+599'  },
  { code: 'CY', nameEn: 'Cyprus',                    nameZh: '塞浦路斯',         dialCode: '+357'  },
  { code: 'CZ', nameEn: 'Czechia',                   nameZh: '捷克',             dialCode: '+420'  },
  { code: 'DK', nameEn: 'Denmark',                   nameZh: '丹麦',             dialCode: '+45'   },
  { code: 'DJ', nameEn: 'Djibouti',                  nameZh: '吉布提',           dialCode: '+253'  },
  { code: 'DM', nameEn: 'Dominica',                  nameZh: '多米尼克',         dialCode: '+1767' },
  { code: 'DO', nameEn: 'Dominican Republic',        nameZh: '多米尼加',         dialCode: '+1809' },
  { code: 'EC', nameEn: 'Ecuador',                   nameZh: '厄瓜多尔',         dialCode: '+593'  },
  { code: 'EG', nameEn: 'Egypt',                     nameZh: '埃及',             dialCode: '+20'   },
  { code: 'SV', nameEn: 'El Salvador',               nameZh: '萨尔瓦多',         dialCode: '+503'  },
  { code: 'GQ', nameEn: 'Equatorial Guinea',         nameZh: '赤道几内亚',       dialCode: '+240'  },
  { code: 'ER', nameEn: 'Eritrea',                   nameZh: '厄立特里亚',       dialCode: '+291'  },
  { code: 'EE', nameEn: 'Estonia',                   nameZh: '爱沙尼亚',         dialCode: '+372'  },
  { code: 'SZ', nameEn: 'Eswatini',                  nameZh: '斯威士兰',         dialCode: '+268'  },
  { code: 'ET', nameEn: 'Ethiopia',                  nameZh: '埃塞俄比亚',       dialCode: '+251'  },
  { code: 'FK', nameEn: 'Falkland Islands',          nameZh: '福克兰群岛',       dialCode: '+500'  },
  { code: 'FO', nameEn: 'Faroe Islands',             nameZh: '法罗群岛',         dialCode: '+298'  },
  { code: 'FJ', nameEn: 'Fiji',                      nameZh: '斐济',             dialCode: '+679'  },
  { code: 'FI', nameEn: 'Finland',                   nameZh: '芬兰',             dialCode: '+358'  },
  { code: 'FR', nameEn: 'France',                    nameZh: '法国',             dialCode: '+33'   },
  { code: 'GF', nameEn: 'French Guiana',             nameZh: '法属圭亚那',       dialCode: '+594'  },
  { code: 'PF', nameEn: 'French Polynesia',          nameZh: '法属波利尼西亚',   dialCode: '+689'  },
  { code: 'GA', nameEn: 'Gabon',                     nameZh: '加蓬',             dialCode: '+241'  },
  { code: 'GM', nameEn: 'Gambia',                    nameZh: '冈比亚',           dialCode: '+220'  },
  { code: 'GE', nameEn: 'Georgia',                   nameZh: '格鲁吉亚',         dialCode: '+995'  },
  { code: 'DE', nameEn: 'Germany',                   nameZh: '德国',             dialCode: '+49'   },
  { code: 'GH', nameEn: 'Ghana',                     nameZh: '加纳',             dialCode: '+233'  },
  { code: 'GI', nameEn: 'Gibraltar',                 nameZh: '直布罗陀',         dialCode: '+350'  },
  { code: 'GR', nameEn: 'Greece',                    nameZh: '希腊',             dialCode: '+30'   },
  { code: 'GL', nameEn: 'Greenland',                 nameZh: '格陵兰',           dialCode: '+299'  },
  { code: 'GD', nameEn: 'Grenada',                   nameZh: '格林纳达',         dialCode: '+1473' },
  { code: 'GP', nameEn: 'Guadeloupe',                nameZh: '瓜德罗普',         dialCode: '+590'  },
  { code: 'GU', nameEn: 'Guam',                      nameZh: '关岛',             dialCode: '+1671' },
  { code: 'GT', nameEn: 'Guatemala',                 nameZh: '危地马拉',         dialCode: '+502'  },
  { code: 'GG', nameEn: 'Guernsey',                  nameZh: '根西',             dialCode: '+44'   },
  { code: 'GN', nameEn: 'Guinea',                    nameZh: '几内亚',           dialCode: '+224'  },
  { code: 'GW', nameEn: 'Guinea-Bissau',             nameZh: '几内亚比绍',       dialCode: '+245'  },
  { code: 'GY', nameEn: 'Guyana',                    nameZh: '圭亚那',           dialCode: '+592'  },
  { code: 'HT', nameEn: 'Haiti',                     nameZh: '海地',             dialCode: '+509'  },
  { code: 'HN', nameEn: 'Honduras',                  nameZh: '洪都拉斯',         dialCode: '+504'  },
  { code: 'HK', nameEn: 'Hong Kong',                 nameZh: '中国香港',         dialCode: '+852'  },
  { code: 'HU', nameEn: 'Hungary',                   nameZh: '匈牙利',           dialCode: '+36'   },
  { code: 'IS', nameEn: 'Iceland',                   nameZh: '冰岛',             dialCode: '+354'  },
  { code: 'IN', nameEn: 'India',                     nameZh: '印度',             dialCode: '+91'   },
  { code: 'ID', nameEn: 'Indonesia',                 nameZh: '印度尼西亚',       dialCode: '+62'   },
  { code: 'IR', nameEn: 'Iran',                      nameZh: '伊朗',             dialCode: '+98'   },
  { code: 'IQ', nameEn: 'Iraq',                      nameZh: '伊拉克',           dialCode: '+964'  },
  { code: 'IE', nameEn: 'Ireland',                   nameZh: '爱尔兰',           dialCode: '+353'  },
  { code: 'IM', nameEn: 'Isle of Man',               nameZh: '马恩岛',           dialCode: '+44'   },
  { code: 'IL', nameEn: 'Israel',                    nameZh: '以色列',           dialCode: '+972'  },
  { code: 'IT', nameEn: 'Italy',                     nameZh: '意大利',           dialCode: '+39'   },
  { code: 'JM', nameEn: 'Jamaica',                   nameZh: '牙买加',           dialCode: '+1876' },
  { code: 'JP', nameEn: 'Japan',                     nameZh: '日本',             dialCode: '+81'   },
  { code: 'JE', nameEn: 'Jersey',                    nameZh: '泽西',             dialCode: '+44'   },
  { code: 'JO', nameEn: 'Jordan',                    nameZh: '约旦',             dialCode: '+962'  },
  { code: 'KZ', nameEn: 'Kazakhstan',                nameZh: '哈萨克斯坦',       dialCode: '+7'    },
  { code: 'KE', nameEn: 'Kenya',                     nameZh: '肯尼亚',           dialCode: '+254'  },
  { code: 'KI', nameEn: 'Kiribati',                  nameZh: '基里巴斯',         dialCode: '+686'  },
  { code: 'XK', nameEn: 'Kosovo',                    nameZh: '科索沃',           dialCode: '+383'  },
  { code: 'KW', nameEn: 'Kuwait',                    nameZh: '科威特',           dialCode: '+965'  },
  { code: 'KG', nameEn: 'Kyrgyzstan',                nameZh: '吉尔吉斯斯坦',     dialCode: '+996'  },
  { code: 'LA', nameEn: 'Laos',                      nameZh: '老挝',             dialCode: '+856'  },
  { code: 'LV', nameEn: 'Latvia',                    nameZh: '拉脱维亚',         dialCode: '+371'  },
  { code: 'LB', nameEn: 'Lebanon',                   nameZh: '黎巴嫩',           dialCode: '+961'  },
  { code: 'LS', nameEn: 'Lesotho',                   nameZh: '莱索托',           dialCode: '+266'  },
  { code: 'LR', nameEn: 'Liberia',                   nameZh: '利比里亚',         dialCode: '+231'  },
  { code: 'LY', nameEn: 'Libya',                     nameZh: '利比亚',           dialCode: '+218'  },
  { code: 'LI', nameEn: 'Liechtenstein',             nameZh: '列支敦士登',       dialCode: '+423'  },
  { code: 'LT', nameEn: 'Lithuania',                 nameZh: '立陶宛',           dialCode: '+370'  },
  { code: 'LU', nameEn: 'Luxembourg',                nameZh: '卢森堡',           dialCode: '+352'  },
  { code: 'MO', nameEn: 'Macao',                     nameZh: '中国澳门',         dialCode: '+853'  },
  { code: 'MG', nameEn: 'Madagascar',                nameZh: '马达加斯加',       dialCode: '+261'  },
  { code: 'MW', nameEn: 'Malawi',                    nameZh: '马拉维',           dialCode: '+265'  },
  { code: 'MY', nameEn: 'Malaysia',                  nameZh: '马来西亚',         dialCode: '+60'   },
  { code: 'MV', nameEn: 'Maldives',                  nameZh: '马尔代夫',         dialCode: '+960'  },
  { code: 'ML', nameEn: 'Mali',                      nameZh: '马里',             dialCode: '+223'  },
  { code: 'MT', nameEn: 'Malta',                     nameZh: '马耳他',           dialCode: '+356'  },
  { code: 'MH', nameEn: 'Marshall Islands',          nameZh: '马绍尔群岛',       dialCode: '+692'  },
  { code: 'MQ', nameEn: 'Martinique',                nameZh: '马提尼克',         dialCode: '+596'  },
  { code: 'MR', nameEn: 'Mauritania',                nameZh: '毛里塔尼亚',       dialCode: '+222'  },
  { code: 'MU', nameEn: 'Mauritius',                 nameZh: '毛里求斯',         dialCode: '+230'  },
  { code: 'YT', nameEn: 'Mayotte',                   nameZh: '马约特',           dialCode: '+262'  },
  { code: 'MX', nameEn: 'Mexico',                    nameZh: '墨西哥',           dialCode: '+52'   },
  { code: 'FM', nameEn: 'Micronesia',                nameZh: '密克罗尼西亚',     dialCode: '+691'  },
  { code: 'MD', nameEn: 'Moldova',                   nameZh: '摩尔多瓦',         dialCode: '+373'  },
  { code: 'MC', nameEn: 'Monaco',                    nameZh: '摩纳哥',           dialCode: '+377'  },
  { code: 'MN', nameEn: 'Mongolia',                  nameZh: '蒙古',             dialCode: '+976'  },
  { code: 'ME', nameEn: 'Montenegro',                nameZh: '黑山',             dialCode: '+382'  },
  { code: 'MS', nameEn: 'Montserrat',                nameZh: '蒙特塞拉特',       dialCode: '+1664' },
  { code: 'MA', nameEn: 'Morocco',                   nameZh: '摩洛哥',           dialCode: '+212'  },
  { code: 'MZ', nameEn: 'Mozambique',                nameZh: '莫桑比克',         dialCode: '+258'  },
  { code: 'MM', nameEn: 'Myanmar',                   nameZh: '缅甸',             dialCode: '+95'   },
  { code: 'NA', nameEn: 'Namibia',                   nameZh: '纳米比亚',         dialCode: '+264'  },
  { code: 'NR', nameEn: 'Nauru',                     nameZh: '瑙鲁',             dialCode: '+674'  },
  { code: 'NP', nameEn: 'Nepal',                     nameZh: '尼泊尔',           dialCode: '+977'  },
  { code: 'NL', nameEn: 'Netherlands',               nameZh: '荷兰',             dialCode: '+31'   },
  { code: 'NC', nameEn: 'New Caledonia',             nameZh: '新喀里多尼亚',     dialCode: '+687'  },
  { code: 'NZ', nameEn: 'New Zealand',               nameZh: '新西兰',           dialCode: '+64'   },
  { code: 'NI', nameEn: 'Nicaragua',                 nameZh: '尼加拉瓜',         dialCode: '+505'  },
  { code: 'NE', nameEn: 'Niger',                     nameZh: '尼日尔',           dialCode: '+227'  },
  { code: 'NG', nameEn: 'Nigeria',                   nameZh: '尼日利亚',         dialCode: '+234'  },
  { code: 'NU', nameEn: 'Niue',                      nameZh: '纽埃',             dialCode: '+683'  },
  { code: 'NF', nameEn: 'Norfolk Island',            nameZh: '诺福克岛',         dialCode: '+672'  },
  { code: 'KP', nameEn: 'North Korea',               nameZh: '朝鲜',             dialCode: '+850'  },
  { code: 'MK', nameEn: 'North Macedonia',           nameZh: '北马其顿',         dialCode: '+389'  },
  { code: 'MP', nameEn: 'Northern Mariana Islands',  nameZh: '北马里亚纳群岛',   dialCode: '+1670' },
  { code: 'NO', nameEn: 'Norway',                    nameZh: '挪威',             dialCode: '+47'   },
  { code: 'OM', nameEn: 'Oman',                      nameZh: '阿曼',             dialCode: '+968'  },
  { code: 'PK', nameEn: 'Pakistan',                  nameZh: '巴基斯坦',         dialCode: '+92'   },
  { code: 'PW', nameEn: 'Palau',                     nameZh: '帕劳',             dialCode: '+680'  },
  { code: 'PS', nameEn: 'Palestine',                 nameZh: '巴勒斯坦',         dialCode: '+970'  },
  { code: 'PA', nameEn: 'Panama',                    nameZh: '巴拿马',           dialCode: '+507'  },
  { code: 'PG', nameEn: 'Papua New Guinea',          nameZh: '巴布亚新几内亚',   dialCode: '+675'  },
  { code: 'PY', nameEn: 'Paraguay',                  nameZh: '巴拉圭',           dialCode: '+595'  },
  { code: 'PE', nameEn: 'Peru',                      nameZh: '秘鲁',             dialCode: '+51'   },
  { code: 'PH', nameEn: 'Philippines',               nameZh: '菲律宾',           dialCode: '+63'   },
  { code: 'PN', nameEn: 'Pitcairn Islands',          nameZh: '皮特凯恩群岛',     dialCode: '+64'   },
  { code: 'PL', nameEn: 'Poland',                    nameZh: '波兰',             dialCode: '+48'   },
  { code: 'PT', nameEn: 'Portugal',                  nameZh: '葡萄牙',           dialCode: '+351'  },
  { code: 'PR', nameEn: 'Puerto Rico',               nameZh: '波多黎各',         dialCode: '+1787' },
  { code: 'QA', nameEn: 'Qatar',                     nameZh: '卡塔尔',           dialCode: '+974'  },
  { code: 'RE', nameEn: 'Réunion',                   nameZh: '留尼汪',           dialCode: '+262'  },
  { code: 'RO', nameEn: 'Romania',                   nameZh: '罗马尼亚',         dialCode: '+40'   },
  { code: 'RU', nameEn: 'Russia',                    nameZh: '俄罗斯',           dialCode: '+7'    },
  { code: 'RW', nameEn: 'Rwanda',                    nameZh: '卢旺达',           dialCode: '+250'  },
  { code: 'BL', nameEn: 'Saint Barthélemy',          nameZh: '圣巴泰勒米',       dialCode: '+590'  },
  { code: 'SH', nameEn: 'Saint Helena',              nameZh: '圣赫勒拿',         dialCode: '+290'  },
  { code: 'KN', nameEn: 'Saint Kitts and Nevis',     nameZh: '圣基茨和尼维斯',   dialCode: '+1869' },
  { code: 'LC', nameEn: 'Saint Lucia',               nameZh: '圣卢西亚',         dialCode: '+1758' },
  { code: 'MF', nameEn: 'Saint Martin',              nameZh: '法属圣马丁',       dialCode: '+590'  },
  { code: 'PM', nameEn: 'Saint Pierre and Miquelon', nameZh: '圣皮埃尔和密克隆', dialCode: '+508'  },
  { code: 'VC', nameEn: 'Saint Vincent and the Grenadines', nameZh: '圣文森特和格林纳丁斯', dialCode: '+1784' },
  { code: 'WS', nameEn: 'Samoa',                     nameZh: '萨摩亚',           dialCode: '+685'  },
  { code: 'SM', nameEn: 'San Marino',                nameZh: '圣马力诺',         dialCode: '+378'  },
  { code: 'ST', nameEn: 'São Tomé and Príncipe',     nameZh: '圣多美和普林西比', dialCode: '+239'  },
  { code: 'SA', nameEn: 'Saudi Arabia',              nameZh: '沙特阿拉伯',       dialCode: '+966'  },
  { code: 'SN', nameEn: 'Senegal',                   nameZh: '塞内加尔',         dialCode: '+221'  },
  { code: 'RS', nameEn: 'Serbia',                    nameZh: '塞尔维亚',         dialCode: '+381'  },
  { code: 'SC', nameEn: 'Seychelles',                nameZh: '塞舌尔',           dialCode: '+248'  },
  { code: 'SL', nameEn: 'Sierra Leone',              nameZh: '塞拉利昂',         dialCode: '+232'  },
  { code: 'SG', nameEn: 'Singapore',                 nameZh: '新加坡',           dialCode: '+65'   },
  { code: 'SX', nameEn: 'Sint Maarten',              nameZh: '荷属圣马丁',       dialCode: '+1721' },
  { code: 'SK', nameEn: 'Slovakia',                  nameZh: '斯洛伐克',         dialCode: '+421'  },
  { code: 'SI', nameEn: 'Slovenia',                  nameZh: '斯洛文尼亚',       dialCode: '+386'  },
  { code: 'SB', nameEn: 'Solomon Islands',           nameZh: '所罗门群岛',       dialCode: '+677'  },
  { code: 'SO', nameEn: 'Somalia',                   nameZh: '索马里',           dialCode: '+252'  },
  { code: 'ZA', nameEn: 'South Africa',              nameZh: '南非',             dialCode: '+27'   },
  { code: 'GS', nameEn: 'South Georgia and the South Sandwich Islands', nameZh: '南乔治亚和南桑威奇群岛', dialCode: '+500' },
  { code: 'KR', nameEn: 'South Korea',               nameZh: '韩国',             dialCode: '+82'   },
  { code: 'SS', nameEn: 'South Sudan',               nameZh: '南苏丹',           dialCode: '+211'  },
  { code: 'ES', nameEn: 'Spain',                     nameZh: '西班牙',           dialCode: '+34'   },
  { code: 'LK', nameEn: 'Sri Lanka',                 nameZh: '斯里兰卡',         dialCode: '+94'   },
  { code: 'SD', nameEn: 'Sudan',                     nameZh: '苏丹',             dialCode: '+249'  },
  { code: 'SR', nameEn: 'Suriname',                  nameZh: '苏里南',           dialCode: '+597'  },
  { code: 'SJ', nameEn: 'Svalbard and Jan Mayen',    nameZh: '斯瓦尔巴和扬马延', dialCode: '+47'   },
  { code: 'SE', nameEn: 'Sweden',                    nameZh: '瑞典',             dialCode: '+46'   },
  { code: 'CH', nameEn: 'Switzerland',               nameZh: '瑞士',             dialCode: '+41'   },
  { code: 'SY', nameEn: 'Syria',                     nameZh: '叙利亚',           dialCode: '+963'  },
  { code: 'TW', nameEn: 'Taiwan',                    nameZh: '中国台湾',         dialCode: '+886'  },
  { code: 'TJ', nameEn: 'Tajikistan',                nameZh: '塔吉克斯坦',       dialCode: '+992'  },
  { code: 'TZ', nameEn: 'Tanzania',                  nameZh: '坦桑尼亚',         dialCode: '+255'  },
  { code: 'TH', nameEn: 'Thailand',                  nameZh: '泰国',             dialCode: '+66'   },
  { code: 'TL', nameEn: 'Timor-Leste',               nameZh: '东帝汶',           dialCode: '+670'  },
  { code: 'TG', nameEn: 'Togo',                      nameZh: '多哥',             dialCode: '+228'  },
  { code: 'TK', nameEn: 'Tokelau',                   nameZh: '托克劳',           dialCode: '+690'  },
  { code: 'TO', nameEn: 'Tonga',                     nameZh: '汤加',             dialCode: '+676'  },
  { code: 'TT', nameEn: 'Trinidad and Tobago',       nameZh: '特立尼达和多巴哥', dialCode: '+1868' },
  { code: 'TN', nameEn: 'Tunisia',                   nameZh: '突尼斯',           dialCode: '+216'  },
  { code: 'TR', nameEn: 'Turkey',                    nameZh: '土耳其',           dialCode: '+90'   },
  { code: 'TM', nameEn: 'Turkmenistan',              nameZh: '土库曼斯坦',       dialCode: '+993'  },
  { code: 'TC', nameEn: 'Turks and Caicos Islands',  nameZh: '特克斯和凯科斯群岛', dialCode: '+1649' },
  { code: 'TV', nameEn: 'Tuvalu',                    nameZh: '图瓦卢',           dialCode: '+688'  },
  { code: 'UG', nameEn: 'Uganda',                    nameZh: '乌干达',           dialCode: '+256'  },
  { code: 'UA', nameEn: 'Ukraine',                   nameZh: '乌克兰',           dialCode: '+380'  },
  { code: 'AE', nameEn: 'United Arab Emirates',      nameZh: '阿联酋',           dialCode: '+971'  },
  { code: 'GB', nameEn: 'United Kingdom',            nameZh: '英国',             dialCode: '+44'   },
  { code: 'US', nameEn: 'United States',             nameZh: '美国',             dialCode: '+1'    },
  { code: 'UY', nameEn: 'Uruguay',                   nameZh: '乌拉圭',           dialCode: '+598'  },
  { code: 'UZ', nameEn: 'Uzbekistan',                nameZh: '乌兹别克斯坦',     dialCode: '+998'  },
  { code: 'VU', nameEn: 'Vanuatu',                   nameZh: '瓦努阿图',         dialCode: '+678'  },
  { code: 'VA', nameEn: 'Vatican City',              nameZh: '梵蒂冈',           dialCode: '+379'  },
  { code: 'VE', nameEn: 'Venezuela',                 nameZh: '委内瑞拉',         dialCode: '+58'   },
  { code: 'VN', nameEn: 'Vietnam',                   nameZh: '越南',             dialCode: '+84'   },
  { code: 'WF', nameEn: 'Wallis and Futuna',         nameZh: '瓦利斯和富图纳',   dialCode: '+681'  },
  { code: 'EH', nameEn: 'Western Sahara',            nameZh: '西撒哈拉',         dialCode: '+212'  },
  { code: 'YE', nameEn: 'Yemen',                     nameZh: '也门',             dialCode: '+967'  },
  { code: 'ZM', nameEn: 'Zambia',                    nameZh: '赞比亚',           dialCode: '+260'  },
  { code: 'ZW', nameEn: 'Zimbabwe',                  nameZh: '津巴布韦',         dialCode: '+263'  },
]);

/**
 * 根据 locale 获取本地化国家列表
 */
export function getLocalizedCountries(locale: string): LocalizedCountry[] {
  const isZh = locale === 'zh' || locale.startsWith('zh-');

  return COUNTRIES.map((country) => ({
    code: country.code,
    name: isZh ? country.nameZh : country.nameEn,
    dialCode: country.dialCode,
  }));
}

/**
 * 根据国家代码获取国家信息(不区分大小写)
 */
export function getCountryByCode(code: string): CountryOption | undefined {
  if (!code || typeof code !== 'string') return undefined;
  const upperCode = code.toUpperCase();
  return COUNTRIES.find((country) => country.code === upperCode);
}

/**
 * 根据国家代码获取国际电话区号
 */
export function getDialCodeByCountry(code: string): string | undefined {
  return getCountryByCode(code)?.dialCode;
}

/**
 * 根据 ISO 国家代码生成国旗 emoji(纯算,无需图片资产)
 */
export function getFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const A = 0x1f1e6;
  const codePoints = [...upper].map((c) => A + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}
