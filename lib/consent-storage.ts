/**
 * Cookie 同意选择的本地持久化
 *
 * 存 localStorage 而不是 cookie:存储「访客同意与否」这件事本身在 ePrivacy
 * 下属于严格必要,不需要先取得同意;而多写一个 cookie 反而会让 cookie 清单
 * 变长、隐私政策更难说清。
 *
 * 全部读写都包 try/catch:Safari 无痕模式、「阻止跨站跟踪」以及部分企业
 * 浏览器策略下,单是访问 localStorage 就会抛异常。同意条绝不能因此崩掉整页。
 *
 * 带版本号是为了将来隐私政策实质性变更时能重新征询 —— 版本对不上一律
 * 视为未选择。
 */

/** 同意选择的三种状态,unset 表示访客还没做过选择 */
export type ConsentState = 'granted' | 'denied' | 'unset';

/** 访客能做出的两种明确选择 */
export type ConsentDecision = Exclude<ConsentState, 'unset'>;

/** localStorage 键名 */
export const CONSENT_STORAGE_KEY = 'bb_consent';

/** 当前同意版本。隐私政策实质变更时递增,以重新征询所有访客 */
export const CONSENT_VERSION = 1;

interface StoredConsent {
  /** 版本号 */
  v: number;
  /** 决定 */
  d: ConsentDecision;
  /** 做出决定的时间戳(毫秒) */
  t: number;
}

/**
 * 解析可选的 storage 参数
 *
 * 传 undefined 表示「用默认的 window.localStorage」,传 null 表示
 * 「明确没有可用存储」。服务端渲染时 window 不存在,一律返回 null。
 */
function resolveStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) {
    return storage;
  }

  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isConsentDecision(value: unknown): value is ConsentDecision {
  return value === 'granted' || value === 'denied';
}

/**
 * 读取访客已做出的同意选择
 *
 * 任何异常、任何无法识别的内容都返回 unset —— 宁可多问一次,也不能把
 * 损坏的数据当成「已同意」。
 *
 * @param storage - 可选的存储实现,便于测试注入
 */
export function readConsent(storage?: Storage | null): ConsentState {
  const target = resolveStorage(storage);

  if (!target) {
    return 'unset';
  }

  try {
    const raw = target.getItem(CONSENT_STORAGE_KEY);

    if (!raw) {
      return 'unset';
    }

    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) {
      return 'unset';
    }

    const record = parsed as Partial<StoredConsent>;

    if (record.v !== CONSENT_VERSION || !isConsentDecision(record.d)) {
      return 'unset';
    }

    return record.d;
  } catch {
    return 'unset';
  }
}

/**
 * 记录访客的同意选择
 *
 * @param decision - granted 或 denied
 * @param storage - 可选的存储实现,便于测试注入
 * @returns 是否写入成功。写入失败不影响本次会话的行为,只是下次还会再问
 */
export function writeConsent(
  decision: ConsentDecision,
  storage?: Storage | null
): boolean {
  const target = resolveStorage(storage);

  if (!target) {
    return false;
  }

  const payload: StoredConsent = {
    v: CONSENT_VERSION,
    d: decision,
    t: Date.now(),
  };

  try {
    target.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * 清除已记录的同意选择,使同意条重新出现
 *
 * 供隐私政策页的「重新设置我的选择」入口使用。
 */
export function clearConsent(storage?: Storage | null): void {
  const target = resolveStorage(storage);

  if (!target) {
    return;
  }

  try {
    target.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // 清不掉就算了:下次读取时版本或内容校验仍会兜住
  }
}
