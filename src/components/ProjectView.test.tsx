import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectView } from './ProjectView'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    github: {
      listIssues: vi.fn(),
      createIssue: vi.fn(),
    },
    devin: {
      listSessions: vi.fn(),
      createSession: vi.fn(),
      sendMessage: vi.fn(),
      getSession: vi.fn(),
    },
  },
}))

const mockRepo = {
  id: 1,
  name: 'test-repo',
  full_name: 'user/test-repo',
  description: 'A test repository',
  html_url: 'https://github.com/user/test-repo',
}

const mockIssues = [
  {
    id: 1,
    number: 1,
    title: 'Test Issue',
    body: 'This is a test issue',
    state: 'open',
    html_url: 'https://github.com/user/test-repo/issues/1',
    created_at: new Date().toISOString(),
    user: {
      login: 'testuser',
      avatar_url: 'https://github.com/testuser.png',
    },
  },
  {
    id: 2,
    number: 2,
    title: 'Another Issue',
    body: 'Another test issue body',
    state: 'open',
    html_url: 'https://github.com/user/test-repo/issues/2',
    created_at: new Date().toISOString(),
    user: {
      login: 'anotheruser',
      avatar_url: 'https://github.com/anotheruser.png',
    },
  },
]

const mockSessions = [
  {
    session_id: 'session-1',
    status: 'running',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: 'Test Session',
    tags: ['repo:user/test-repo'],
  },
]

describe('ProjectView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render repository name', async () => {
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    render(<ProjectView repo={mockRepo} />)
    
    expect(screen.getByText('test-repo')).toBeInTheDocument()
  })

  it('should show Issues tab by default', async () => {
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
    })
  })

  it('should display issues after loading', async () => {
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
      expect(screen.getByText('Another Issue')).toBeInTheDocument()
    })
  })

  it('should switch to Sessions tab when clicked', async () => {
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    vi.mocked(api.devin.listSessions).mockResolvedValue({ sessions: mockSessions })
    
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
    })
    
    const sessionsTab = screen.getByText('Sessions')
    fireEvent.click(sessionsTab)
    
    await waitFor(() => {
      expect(api.devin.listSessions).toHaveBeenCalled()
    })
  })

  it('should show create issue form when New Issue button is clicked', async () => {
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
    })
    
      const newIssueButton = screen.getByText('New Issue')
      fireEvent.click(newIssueButton)
    
      expect(screen.getByPlaceholderText('Issue Title')).toBeInTheDocument()
    })

  it('should create a new issue', async () => {
    const newIssue = {
      id: 3,
      number: 3,
      title: 'New Test Issue',
      body: 'New issue body',
      state: 'open',
      html_url: 'https://github.com/user/test-repo/issues/3',
      created_at: new Date().toISOString(),
      user: { login: 'testuser', avatar_url: '' },
    }
    
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    vi.mocked(api.github.createIssue).mockResolvedValue(newIssue)
    
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('New Issue'))
    
        const titleInput = screen.getByPlaceholderText('Issue Title')
        const bodyInput = screen.getByPlaceholderText('Describe the issue...')
    
    fireEvent.change(titleInput, { target: { value: 'New Test Issue' } })
    fireEvent.change(bodyInput, { target: { value: 'New issue body' } })
    
    const createButton = screen.getByText('Create Issue')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(api.github.createIssue).toHaveBeenCalledWith(
        'user',
        'test-repo',
        'New Test Issue',
        'New issue body'
      )
    })
  })

  it('should handle API errors when loading issues', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.github.listIssues).mockRejectedValue(new Error('API Error'))
    
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
    
    consoleSpy.mockRestore()
  })

  it('should filter sessions by repo tag', async () => {
    const mixedSessions = [
      ...mockSessions,
      {
        session_id: 'session-2',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: 'Other Session',
        tags: ['repo:other/repo'],
      },
    ]
    
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    vi.mocked(api.devin.listSessions).mockResolvedValue({ sessions: mixedSessions })
    
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Sessions'))
    
    await waitFor(() => {
      expect(api.devin.listSessions).toHaveBeenCalled()
    })
  })

  it('should cancel issue creation', async () => {
    vi.mocked(api.github.listIssues).mockResolvedValue(mockIssues)
    render(<ProjectView repo={mockRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument()
    })
    
        fireEvent.click(screen.getByText('New Issue'))
        expect(screen.getByPlaceholderText('Issue Title')).toBeInTheDocument()
    
        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.queryByPlaceholderText('Issue Title')).not.toBeInTheDocument()
  })
})
