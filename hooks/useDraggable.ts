'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Position {
  x: number;
  y: number;
}

export type Axis = 'x' | 'y' | 'none';

export interface UseDraggableOptions {
  /** 初始位置（屏幕坐标） */
  initial: Position;
  /** 卡片尺寸，用于边界 clamp（不传则不 clamp） */
  size?: { width: number; height: number };
  /** 是否启用拖动（false 时返回不变的位置，不挂监听） */
  enabled?: boolean;
  /**
   * 锁定哪个轴 — 'x' = X 固定（只能上下拖）、'y' = Y 固定（只能左右拖）、
   * 'none'（默认）= 双向自由拖
   */
  lockAxis?: Axis;
  /** Y 轴可拖区间（绝对屏幕坐标）。设置后覆盖 size 推算的纵向 clamp */
  yBounds?: { min: number; max: number };
  /** X 轴可拖区间（绝对屏幕坐标）。设置后覆盖 size 推算的横向 clamp */
  xBounds?: { min: number; max: number };
  /** 判定为"真实拖动"的位移阈值（px），默认 5 */
  dragThreshold?: number;
}

export interface UseDraggableReturn {
  position: Position;
  setPosition: (p: Position) => void;
  isDragging: boolean;
  /**
   * 本次 pointer 交互期间是否累计位移超过阈值。
   * 拖动结束（pointerup）后到下一次 pointerdown 之间，此 ref 保留 true，
   * 供消费者在 onClick 里判断"刚才是拖动还是点击"。消费者用完应自行清回 false。
   */
  wasDraggedRef: React.MutableRefObject<boolean>;
  /** 把这些 props 摊到拖动手柄元素上 */
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    style: React.CSSProperties;
  };
}

/**
 * 轻量拖动 Hook：基于 pointer events，无第三方依赖。
 *
 * 在拖动手柄上 spread `handleProps`，元素根据返回的 `position` 定位即可。
 *
 * 想要单轴拖动：传 `lockAxis: 'x'`（X 固定，只能上下）或 `lockAxis: 'y'`。
 * 想要自定义边界：传 `yBounds` 或 `xBounds`（绝对坐标的 min/max）。
 */
export function useDraggable({
  initial,
  size,
  enabled = true,
  lockAxis = 'none',
  yBounds,
  xBounds,
  dragThreshold = 5,
}: UseDraggableOptions): UseDraggableReturn {
  const [position, setPositionState] = useState<Position>(initial);
  const [isDragging, setIsDragging] = useState(false);

  const offsetRef = useRef<Position>({ x: 0, y: 0 });
  const startRef = useRef<Position>({ x: 0, y: 0 });
  const wasDraggedRef = useRef(false);

  const clamp = useCallback(
    (p: Position): Position => {
      if (typeof window === 'undefined') return p;
      // 先处理 axis lock
      const next: Position = {
        x: lockAxis === 'x' ? initial.x : p.x,
        y: lockAxis === 'y' ? initial.y : p.y,
      };

      // X clamp
      if (xBounds) {
        next.x = Math.min(Math.max(xBounds.min, next.x), xBounds.max);
      } else if (size) {
        const maxX = Math.max(0, window.innerWidth - size.width);
        next.x = Math.min(Math.max(0, next.x), maxX);
      }

      // Y clamp
      if (yBounds) {
        next.y = Math.min(Math.max(yBounds.min, next.y), yBounds.max);
      } else if (size) {
        const maxY = Math.max(0, window.innerHeight - size.height);
        next.y = Math.min(Math.max(0, next.y), maxY);
      }

      return next;
    },
    [size, lockAxis, initial.x, initial.y, xBounds, yBounds]
  );

  const setPosition = useCallback(
    (p: Position) => setPositionState(clamp(p)),
    [clamp]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      if (e.button !== 0) return;
      offsetRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      startRef.current = { x: e.clientX, y: e.clientY };
      wasDraggedRef.current = false;
      setIsDragging(true);
    },
    [enabled, position.x, position.y]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (!wasDraggedRef.current && Math.hypot(dx, dy) > dragThreshold) {
        wasDraggedRef.current = true;
      }
      setPositionState(() =>
        clamp({
          x: e.clientX - offsetRef.current.x,
          y: e.clientY - offsetRef.current.y,
        })
      );
    };
    const handleUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isDragging, clamp, dragThreshold]);

  // 窗口 resize → 重新 clamp
  useEffect(() => {
    if (!enabled) return;
    if (!size && !yBounds && !xBounds) return;
    const handleResize = () => {
      setPositionState((prev) => clamp(prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, size, yBounds, xBounds, clamp]);

  return {
    position,
    setPosition,
    isDragging,
    wasDraggedRef,
    handleProps: {
      onPointerDown,
      style: {
        cursor: enabled ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: lockAxis === 'x' ? 'pan-x' : lockAxis === 'y' ? 'pan-y' : 'none',
      },
    },
  };
}
