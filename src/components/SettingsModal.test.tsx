import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsModal } from './SettingsModal'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    getDevinToken: vi.fn(),
    setDevinToken: vi.fn(),
  },
}))

describe('SettingsModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(<SettingsModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    vi.mocked(api.getDevinToken).mockReturnValue('')
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Devin API Key')).toBeInTheDocument()
  })

  it('should load existing token on open', () => {
    vi.mocked(api.getDevinToken).mockReturnValue('test-token')
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />)
    const input = screen.getByPlaceholderText('bun_...') as HTMLInputElement
    expect(input.value).toBe('test-token')
  })

  it('should call onClose when Cancel button is clicked', () => {
    vi.mocked(api.getDevinToken).mockReturnValue('')
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when X button is clicked', () => {
    vi.mocked(api.getDevinToken).mockReturnValue('')
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />)
    const closeButtons = screen.getAllByRole('button')
    const xButton = closeButtons.find(btn => btn.querySelector('svg'))
    if (xButton) {
      fireEvent.click(xButton)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('should save token and close when Save Changes is clicked', () => {
    vi.mocked(api.getDevinToken).mockReturnValue('')
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />)
    
    const input = screen.getByPlaceholderText('bun_...')
    fireEvent.change(input, { target: { value: 'new-token' } })
    fireEvent.click(screen.getByText('Save Changes'))
    
    expect(api.setDevinToken).toHaveBeenCalledWith('new-token')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should update input value when typing', () => {
    vi.mocked(api.getDevinToken).mockReturnValue('')
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />)
    
    const input = screen.getByPlaceholderText('bun_...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'my-api-key' } })
    
    expect(input.value).toBe('my-api-key')
  })
})
