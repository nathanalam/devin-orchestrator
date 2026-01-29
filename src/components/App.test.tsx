import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('./Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard Component</div>,
}))

describe('App', () => {
  it('should render the Dashboard component', () => {
    render(<App />)
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })

  it('should render without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })
})
