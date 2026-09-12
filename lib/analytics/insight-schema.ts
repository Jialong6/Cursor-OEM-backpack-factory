import { z } from 'zod';
import {
  INSIGHT_EVENT_NAMES,
  MAX_DWELL_ENTRIES_PER_BATCH,
  MAX_EVENTS_PER_BATCH,
} from './events';

/**
 * 上报载荷的服务端校验
 *
 * 单独成模块而不是塞进 events.ts:后者会被打进客户端包,没必要把 zod
 * 也拖进去。事件名的枚举仍然从 events.ts 取,两端共用同一个来源,
 * 形状不会漂移。
 *
 * 这道闸门防的是恶意构造:上报端点是公开的,任何人都能往里灌东西。
 * 所以每个字符串都有长度上限,每个数组都有条数上限,props 只收标量。
 */

/** 单个维度的值只允许标量,复杂结构不进库 */
const propValueSchema = z.union([
  z.string().max(200),
  z.number().finite(),
  z.boolean(),
]);

const propsSchema = z
  .record(z.string().max(40), propValueSchema)
  .refine((props) => Object.keys(props).length <= 12, {
    message: 'too many props',
  });

const eventSchema = z.object({
  // pageViewId 在信封上已经有了,事件里那份是客户端归属用的,服务端不重复存
  pageViewId: z.string().max(64).optional(),
  name: z.enum(INSIGHT_EVENT_NAMES),
  ts: z.number().int().min(0).max(86_400_000),
  props: propsSchema.default({}),
});

const dwellSchema = z.object({
  sectionId: z.string().min(1).max(120),
  ms: z.number().int().min(0).max(86_400_000),
  enterCount: z.number().int().min(0).max(10_000),
  maxCoverage: z.number().min(0).max(1),
});

export const insightEnvelopeSchema = z.object({
  v: z.number().int().min(1).max(9),
  pageViewId: z.string().min(1).max(64),
  seq: z.number().int().min(0).max(100_000),
  path: z.string().max(512),
  locale: z.string().max(16).default(''),
  referrer: z.string().max(2_048).optional(),
  viewport: z
    .object({
      w: z.number().int().min(0).max(20_000),
      h: z.number().int().min(0).max(20_000),
    })
    .default({ w: 0, h: 0 }),
  utm: z
    .object({
      source: z.string().max(128).optional(),
      medium: z.string().max(128).optional(),
      campaign: z.string().max(128).optional(),
    })
    .optional(),
  events: z.array(eventSchema).max(MAX_EVENTS_PER_BATCH).default([]),
  dwell: z.array(dwellSchema).max(MAX_DWELL_ENTRIES_PER_BATCH).default([]),
});

export type ValidatedEnvelope = z.infer<typeof insightEnvelopeSchema>;
