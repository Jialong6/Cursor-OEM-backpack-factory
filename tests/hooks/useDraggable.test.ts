import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraggable } from '@/hooks/useDraggable';

describe('useDraggable', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true });
  });

  it('returns the initial position when not dragged', () => {
    const { result } = renderHook(() =>
      useDraggable({ initial: { x: 100, y: 50 } })
    );
    expect(result.current.position).toEqual({ x: 100, y: 50 });
    expect(result.current.isDragging).toBe(false);
  });

  it('clamps setPosition within viewport when size is given', () => {
    const { result } = renderHook(() =>
      useDraggable({
        initial: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
      })
    );

    // 超出右下界 → clamp 到 viewport - size
    act(() => result.current.setPosition({ x: 9999, y: 9999 }));
    expect(result.current.position).toEqual({ x: 1024 - 400, y: 768 - 300 });

    // 负值 → clamp 到 0
    act(() => result.current.setPosition({ x: -50, y: -50 }));
    expect(result.current.position).toEqual({ x: 0, y: 0 });
  });

  it('does not clamp when no size is given', () => {
    const { result } = renderHook(() =>
      useDraggable({ initial: { x: 0, y: 0 } })
    );
    act(() => result.current.setPosition({ x: 9999, y: 9999 }));
    expect(result.current.position).toEqual({ x: 9999, y: 9999 });
  });

  it('handleProps exposes onPointerDown and cursor style', () => {
    const { result } = renderHook(() =>
      useDraggable({ initial: { x: 0, y: 0 } })
    );
    expect(typeof result.current.handleProps.onPointerDown).toBe('function');
    expect(result.current.handleProps.style.cursor).toBe('grab');
    expect(result.current.handleProps.style.touchAction).toBe('none');
  });

  it('disabled mode does not enter dragging state on pointerdown', () => {
    const { result } = renderHook(() =>
      useDraggable({ initial: { x: 10, y: 10 }, enabled: false })
    );
    act(() => {
      result.current.handleProps.onPointerDown({
        button: 0,
        clientX: 50,
        clientY: 50,
      } as unknown as React.PointerEvent);
    });
    expect(result.current.isDragging).toBe(false);
    expect(result.current.handleProps.style.cursor).toBe('default');
  });

  it('lockAxis="x" keeps X fixed at initial.x regardless of setPosition.x', () => {
    const { result } = renderHook(() =>
      useDraggable({
        initial: { x: 800, y: 100 },
        lockAxis: 'x',
        yBounds: { min: 50, max: 600 },
      })
    );
    act(() => result.current.setPosition({ x: 200, y: 300 }));
    // X 仍是 initial.x（被 lockAxis 锁定）
    expect(result.current.position.x).toBe(800);
    expect(result.current.position.y).toBe(300);
  });

  it('yBounds clamps Y to [min, max]', () => {
    const { result } = renderHook(() =>
      useDraggable({
        initial: { x: 0, y: 100 },
        lockAxis: 'x',
        yBounds: { min: 80, max: 500 },
      })
    );

    // 超过上界
    act(() => result.current.setPosition({ x: 0, y: 9999 }));
    expect(result.current.position.y).toBe(500);

    // 低于下界
    act(() => result.current.setPosition({ x: 0, y: 10 }));
    expect(result.current.position.y).toBe(80);

    // 正常范围
    act(() => result.current.setPosition({ x: 0, y: 250 }));
    expect(result.current.position.y).toBe(250);
  });

  it('exposes wasDraggedRef for click-vs-drag discrimination', () => {
    const { result } = renderHook(() =>
      useDraggable({ initial: { x: 0, y: 0 } })
    );
    expect(result.current.wasDraggedRef).toBeDefined();
    expect(result.current.wasDraggedRef.current).toBe(false);
  });

  it('lockAxis="x" sets touchAction to "pan-x"', () => {
    const { result } = renderHook(() =>
      useDraggable({ initial: { x: 0, y: 0 }, lockAxis: 'x' })
    );
    expect(result.current.handleProps.style.touchAction).toBe('pan-x');
  });
});
