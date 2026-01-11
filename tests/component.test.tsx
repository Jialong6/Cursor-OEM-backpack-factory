import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

/**
 * 简单测试组件
 */
function TestButton({ label }: { label: string }) {
  return <button>{label}</button>
}

/**
 * React 组件测试套件：验证 @testing-library/react 配置
 */
describe('React 组件测试环境验证', () => {
  it('应该能够渲染简单组件', () => {
    render(<TestButton label="点击我" />)

    const button = screen.getByRole('button', { name: '点击我' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('点击我')
  })

  it('应该支持 jest-dom 匹配器', () => {
    render(<div data-testid="test-div" className="test-class">测试内容</div>)

    const div = screen.getByTestId('test-div')
    expect(div).toBeInTheDocument()
    expect(div).toHaveClass('test-class')
    expect(div).toHaveTextContent('测试内容')
  })
})
