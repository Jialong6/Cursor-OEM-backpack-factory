import type { BlogPost } from '../types';

const post: BlogPost = {
  id: "factory-tour-one-day-myanmar",
  slug: "factory-tour-one-day-myanmar",
  title: {
    "ja": "緬甸ヤンゴン工場の「1 日」をご案内します ── 7:30 始業から 18:00 終業まで、写真で巡るバーチャル工場見学",
    "zh": "缅甸仰光工厂的「1 天」── 从 7:30 上班到 18:00 下班，照片陪您走完一趟虚拟参访",
    "en": "One Day at Our Yangon Factory in Myanmar — From the 7:30 Start to the 6:00 Close, a Virtual Tour in Photos",
    "de": "Ein Tag in unserem Werk in Yangon, Myanmar – vom Arbeitsbeginn um 7:30 bis zum Feierabend um 18:00: eine virtuelle Werksbesichtigung in Fotos",
    "nl": "Een dag in onze fabriek in Yangon, Myanmar — van aanvang om 7:30 tot sluiting om 18:00, een virtuele fabrieksrondleiding in foto's",
    "fr": "Une journée dans notre usine de Yangon, au Myanmar — de la prise de poste à 7:30 à la fermeture à 18:00, une visite d'usine virtuelle en photos",
    "pt": "Um dia na nossa fábrica de Yangon, em Mianmar — do início do expediente às 7:30 ao encerramento às 18:00, uma visita virtual em fotos",
    "es": "Un día en nuestra fábrica de Yangon, en Myanmar — del inicio de la jornada a las 7:30 al cierre a las 18:00, una visita virtual en fotos",
    "zh-tw": "緬甸仰光工廠的「1 天」── 從 7:30 上班到 18:00 下班，照片陪您走完一趟虛擬參訪",
    "ru": "Один день на нашей фабрике в Янгоне (Мьянма) — с начала смены в 7:30 до конца рабочего дня в 18:00: виртуальная экскурсия в фотографиях",
    "my": "မြန်မာနိုင်ငံ၊ Yangon မြို့ရှိ ကျွန်ုပ်တို့၏ စက်ရုံ တစ်နေ့တာ — နံနက် 7:30 အလုပ်စတင်ချိန်မှ ညနေ 6:00 အလုပ်ဆင်းချိန်အထိ ဓာတ်ပုံများဖြင့် လေ့လာကြည့်ရှုခြင်း",
    "ko": "미얀마 양곤 공장의 「하루」를 안내해 드립니다 ── 7:30 출근부터 18:00 퇴근까지, 사진으로 둘러보는 버추얼 공장 견학"
  },
  excerpt: {
    "ja": "「ヤンゴンまで工場見学に行きたいけれど、なかなか…」というお客様の本音にお応えして、Better Bags Myanmar 工場の「1 日」を 4 つの場面で巡るバーチャル見学。始業から終業まで、合計約 600 名（縫製 + 補助スタッフ）の現場を公開します。",
    "zh": "「想去仰光参观工厂，但实在抽不出时间…」面对客户的真实心声，我们用 4 个场景带您走一趟 Better Bags Myanmar 工厂的「1 天」虚拟参访。从开工到收工，合计约 600 名（缝纫工 + 辅助人员）的现场全公开。",
    "en": "\"We'd love to visit the factory in Yangon, but we just can't find the time…\" In answer to what clients so often tell us, we walk you through one day at the Better Bags Myanmar factory, in four scenes — from clock-in to clock-out, across a shop floor of around 600 people (sewing operators and support staff).",
    "de": "„Wir würden das Werk in Yangon gern besichtigen, aber die Zeit fehlt einfach …“ Als Antwort auf diesen oft gehörten Satz unserer Kunden führen wir Sie in vier Szenen durch einen Tag im Werk von Better Bags Myanmar – vom Arbeitsbeginn bis zum Feierabend, mit offenem Blick auf einen Betrieb mit insgesamt rund 600 Mitarbeitenden (Nähkräfte und Hilfspersonal).",
    "nl": "\"We zouden de fabriek in Yangon graag bezoeken, maar we krijgen de tijd er maar niet voor vrij…\" Als antwoord op wat klanten ons zo vaak vertellen, nemen we u in 4 scènes mee door een dag in de Better Bags Myanmar-fabriek — van aanvang tot sluiting, op een werkvloer met in totaal circa 600 mensen (naaimedewerkers plus ondersteunend personeel).",
    "fr": "« Nous aimerions visiter l'usine à Yangon, mais nous ne trouvons jamais le temps… » En réponse à cette confidence si fréquente de nos clients, nous vous faisons parcourir en 4 scènes la « journée » de l'usine Better Bags Myanmar : de la prise de poste à la fermeture, un atelier d'environ 600 personnes au total (couture + personnel de soutien) s'ouvre à vous.",
    "pt": "\"Adoraríamos visitar a fábrica em Yangon, mas nunca conseguimos tempo...\" Em resposta ao que tantos clientes nos dizem, percorremos em 4 cenas \"um dia\" na fábrica da Better Bags Myanmar — do início ao fim do expediente, mostrando um chão de fábrica com cerca de 600 pessoas no total (operadores de costura + equipe de apoio).",
    "es": "\"Nos encantaría visitar la fábrica en Yangon, pero nunca encontramos el momento...\" En respuesta a lo que tantos clientes nos dicen, recorremos en 4 escenas \"un día\" en la fábrica de Better Bags Myanmar: del inicio al cierre de la jornada, mostrando una planta con cerca de 600 personas en total (operarios de costura + personal de apoyo).",
    "zh-tw": "「想去仰光參觀工廠，但實在抽不出時間…」面對客戶的真實心聲，我們用 4 個場景帶您走一趟 Better Bags Myanmar 工廠的「1 天」虛擬參訪。從開工到收工，合計約 600 名（車縫人員 + 輔助人員）的現場全公開。",
    "ru": "«Хотелось бы посетить фабрику в Янгоне, но время никак не находится…» В ответ на эту откровенную фразу клиентов мы проводим вас через «один день» фабрики Better Bags Myanmar в 4 сценах — от начала смены до конца рабочего дня, открыто показывая производство, где работают всего около 600 человек (швеи + вспомогательный персонал).",
    "my": "\"Yangon မြို့က စက်ရုံကို လာရောက်လည်ပတ်ချင်ပေမယ့် အချိန်မပေးနိုင်ဖြစ်နေတယ်...\" ဖောက်သည်များ မကြာခဏ ပြောလေ့ရှိသည့် ဤစကားအတွက် တုံ့ပြန်သည့်အနေဖြင့် Better Bags Myanmar စက်ရုံ၏ တစ်နေ့တာကို အပိုင်းလေးပိုင်းဖြင့် လေ့လာကြည့်ရှုနိုင်ရန် တင်ဆက်ပေးလိုက်ပါသည် — အလုပ်စတင်ချိန်မှ အလုပ်ဆင်းချိန်အထိ ဝန်ထမ်းအင်အား 600 ခန့် (ချုပ်လုပ်ရေးဝန်ထမ်းများနှင့် အထောက်အကူပြုဝန်ထမ်းများ) ရှိသော လုပ်ငန်းခွင်အတွင်း လှည့်လည်ကြည့်ရှုနိုင်မည် ဖြစ်ပါသည်။",
    "ko": "「양곤까지 공장 견학을 가고 싶지만, 좀처럼 시간이…」라는 고객의 솔직한 목소리에 답하여, Better Bags Myanmar 공장의 「하루」를 4가지 장면으로 둘러보는 버추얼 견학입니다. 출근부터 퇴근까지, 총 약 600명(봉제 인력 + 보조 인력)의 현장을 공개합니다."
  },
  // 正文按语言拆分为 content.{locale}.ts,经动态 import 加载;
  // 显式列出(不用模板字符串路径)保证打包器可静态分析
  contentLoaders: {
    ja: () => import('./content.ja'),
    zh: () => import('./content.zh'),
    en: () => import('./content.en'),
    de: () => import('./content.de'),
    nl: () => import('./content.nl'),
    fr: () => import('./content.fr'),
    pt: () => import('./content.pt'),
    es: () => import('./content.es'),
    'zh-tw': () => import('./content.zh-tw'),
    ru: () => import('./content.ru'),
    my: () => import('./content.my'),
    ko: () => import('./content.ko'),
  },
  date: "2026-05-20",
  dateModified: "2026-07-07",
  thumbnail: "/images/blog/placeholder-factory-tour.svg",
  category: {
    "ja": "工場見学",
    "zh": "工厂参访",
    "en": "Factory Tour",
    "de": "Werksbesichtigung",
    "nl": "Fabrieksbezoek",
    "fr": "Visite d'usine",
    "pt": "Visita à Fábrica",
    "es": "Visita a la Fábrica",
    "zh-tw": "工廠參訪",
    "ru": "Экскурсия по фабрике",
    "my": "စက်ရုံ လေ့လာကြည့်ရှုခြင်း",
    "ko": "공장 견학"
  },
  authorId: "jay",
  tags: {
    "ja": [
      "工場見学",
      "バーチャル見学",
      "ヤンゴン",
      "Better Bags Myanmar",
      "工場シリーズ Vol.01"
    ],
    "zh": [
      "工厂参访",
      "虚拟参访",
      "仰光",
      "Better Bags Myanmar",
      "工厂系列 Vol.01"
    ],
    "en": [
      "Factory Tour",
      "Virtual Tour",
      "Yangon",
      "Better Bags Myanmar",
      "Factory Series Vol.01"
    ],
    "de": [
      "Werksbesichtigung",
      "Virtueller Rundgang",
      "Yangon",
      "Better Bags Myanmar",
      "Werksserie Vol.01"
    ],
    "nl": [
      "Fabrieksbezoek",
      "Virtuele rondleiding",
      "Yangon",
      "Better Bags Myanmar",
      "Fabrieksserie Vol.01"
    ],
    "fr": [
      "Visite d'usine",
      "Visite virtuelle",
      "Yangon",
      "Better Bags Myanmar",
      "Série Usine Vol.01"
    ],
    "pt": [
      "Visita à Fábrica",
      "Visita Virtual",
      "Yangon",
      "Better Bags Myanmar",
      "Série Fábrica Vol.01"
    ],
    "es": [
      "Visita a la Fábrica",
      "Visita Virtual",
      "Yangon",
      "Better Bags Myanmar",
      "Serie Fábrica Vol.01"
    ],
    "zh-tw": [
      "工廠參訪",
      "虛擬參訪",
      "仰光",
      "Better Bags Myanmar",
      "工廠系列 Vol.01"
    ],
    "ru": [
      "Экскурсия по фабрике",
      "Виртуальная экскурсия",
      "Янгон",
      "Better Bags Myanmar",
      "Серия о фабрике Vol.01"
    ],
    "my": [
      "စက်ရုံ လေ့လာကြည့်ရှုခြင်း",
      "အွန်လိုင်းမှ လေ့လာကြည့်ရှုခြင်း",
      "Yangon",
      "Better Bags Myanmar",
      "စက်ရုံအကြောင်း ဆောင်းပါးတွဲ Vol.01"
    ],
    "ko": [
      "공장 견학",
      "버추얼 견학",
      "양곤",
      "Better Bags Myanmar",
      "공장 시리즈 Vol.01"
    ]
  },
};

export default post;
