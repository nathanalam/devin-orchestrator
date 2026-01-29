import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    getGithubToken: vi.fn(),
    getDevinToken: vi.fn(),
    setGithubToken: vi.fn(),
    setDevinToken: vi.fn(),
    github: {
      getUser: vi.fn(),
      exchangeToken: vi.fn(),
    },
  },
}))

interface MockRepo {
  id: number;
  name: string;
  full_name: string;
}

vi.mock('./RepoList', () => ({
  RepoList: ({ onSelectRepo }: { onSelectRepo: (repo: MockRepo) => void }) => (
    <div data-testid="repo-list">
      <button onClick={() => onSelectRepo({ id: 1, name: 'test-repo', full_name: 'user/test-repo' })}>
        Select Repo
      </button>
    </div>
  ),
}))

vi.mock('./ProjectView', () => ({
  ProjectView: ({ repo }: { repo: MockRepo }) => (
    <div data-testid="project-view">Project View: {repo.name}</div>
  ),
}))

vi.mock('./SettingsModal', () => ({
  SettingsModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="settings-modal"><button onClick={onClose}>Close Settings</button></div> : null
  ),
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        pathname: '/',
        href: '',
      },
      writable: true,
    })
  })

  it('should show loading spinner while checking auth', () => {
    vi.mocked(api.getGithubToken).mockReturnValue('test-token')
    vi.mocked(api.github.getUser).mockImplementation(() => new Promise(() => {}))
    
    render(<Dashboard />)
    
    const spinner = document.querySelector('[style*="animation: spin"]') || 
                    document.querySelector('[style*="border-top-color"]')
    expect(spinner).toBeTruthy()
  })

  it('should show login screen when not authenticated', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue(null)
    vi.mocked(api.getDevinToken).mockReturnValue(null)
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Devin Orchestrator')).toBeInTheDocument()
    })
    expect(screen.getByText('Connect with GitHub')).toBeInTheDocument()
    expect(screen.getByText('Devin API Key')).toBeInTheDocument()
  })

  it('should show main dashboard when authenticated', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue('valid-token')
    vi.mocked(api.getDevinToken).mockReturnValue('devin-token')
    vi.mocked(api.github.getUser).mockResolvedValue({ login: 'testuser' })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByTestId('repo-list')).toBeInTheDocument()
    })
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('should show welcome message when no repo is selected', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue('valid-token')
    vi.mocked(api.getDevinToken).mockReturnValue('devin-token')
    vi.mocked(api.github.getUser).mockResolvedValue({ login: 'testuser' })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Devin Orchestrator')).toBeInTheDocument()
    })
  })

  it('should show ProjectView when a repo is selected', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue('valid-token')
    vi.mocked(api.getDevinToken).mockReturnValue('devin-token')
    vi.mocked(api.github.getUser).mockResolvedValue({ login: 'testuser' })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByTestId('repo-list')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Select Repo'))
    
    await waitFor(() => {
      expect(screen.getByTestId('project-view')).toBeInTheDocument()
    })
    expect(screen.getByText('Project View: test-repo')).toBeInTheDocument()
  })

  it('should handle login button click', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue(null)
    vi.mocked(api.getDevinToken).mockReturnValue(null)
    
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        pathname: '/',
        href: '',
        reload: reloadMock,
      },
      writable: true,
    })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Connect & Continue')).toBeInTheDocument()
    })
    
    const devinInput = screen.getByPlaceholderText('bun_...')
    fireEvent.change(devinInput, { target: { value: 'test-devin-token' } })
    
    fireEvent.click(screen.getByText('Connect & Continue'))
    
    expect(api.setDevinToken).toHaveBeenCalledWith('test-devin-token')
  })

  it('should open settings modal when settings button is clicked', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue('valid-token')
    vi.mocked(api.getDevinToken).mockReturnValue('devin-token')
    vi.mocked(api.github.getUser).mockResolvedValue({ login: 'testuser' })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
    
    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument()
    })
  })

  it('should close settings modal', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue('valid-token')
    vi.mocked(api.getDevinToken).mockReturnValue('devin-token')
    vi.mocked(api.github.getUser).mockResolvedValue({ login: 'testuser' })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
    
    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Close Settings'))
    
    await waitFor(() => {
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument()
    })
  })

  it('should handle failed authentication', async () => {
    vi.mocked(api.getGithubToken).mockReturnValue('invalid-token')
    vi.mocked(api.github.getUser).mockRejectedValue(new Error('Unauthorized'))
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Connect with GitHub')).toBeInTheDocument()
    })
  })
})
