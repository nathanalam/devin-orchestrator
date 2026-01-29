import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RepoList } from './RepoList'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    github: {
      listRepos: vi.fn(),
    },
  },
}))

const mockRepos = [
  {
    id: 1,
    name: 'test-repo',
    full_name: 'user/test-repo',
    description: 'A test repository',
    stargazers_count: 10,
    html_url: 'https://github.com/user/test-repo',
    updated_at: new Date().toISOString(),
    language: 'TypeScript',
  },
  {
    id: 2,
    name: 'another-repo',
    full_name: 'user/another-repo',
    description: 'Another repository for testing',
    stargazers_count: 5,
    html_url: 'https://github.com/user/another-repo',
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    language: 'JavaScript',
  },
]

describe('RepoList', () => {
  const mockOnSelectRepo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    vi.mocked(api.github.listRepos).mockImplementation(() => new Promise(() => {}))
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    expect(screen.getByText('Loading repositories...')).toBeInTheDocument()
  })

  it('should display repositories after loading', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('test-repo')).toBeInTheDocument()
    })
    expect(screen.getByText('another-repo')).toBeInTheDocument()
  })

  it('should display repository descriptions', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('A test repository')).toBeInTheDocument()
    })
  })

  it('should display star counts', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  it('should display language for repositories', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
    })
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
  })

  it('should call onSelectRepo when a repository is clicked', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('test-repo')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('test-repo'))
    expect(mockOnSelectRepo).toHaveBeenCalledWith(mockRepos[0])
  })

  it('should filter repositories based on search input', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('test-repo')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search repositories...')
    fireEvent.change(searchInput, { target: { value: 'another' } })
    
    expect(screen.queryByText('test-repo')).not.toBeInTheDocument()
    expect(screen.getByText('another-repo')).toBeInTheDocument()
  })

  it('should show no repositories message when filter returns empty', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('test-repo')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search repositories...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    
    expect(screen.getByText('No repositories found')).toBeInTheDocument()
  })

  it('should filter by description as well', async () => {
    vi.mocked(api.github.listRepos).mockResolvedValue(mockRepos)
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(screen.getByText('test-repo')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search repositories...')
    fireEvent.change(searchInput, { target: { value: 'testing' } })
    
    expect(screen.queryByText('test-repo')).not.toBeInTheDocument()
    expect(screen.getByText('another-repo')).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.github.listRepos).mockRejectedValue(new Error('API Error'))
    render(<RepoList onSelectRepo={mockOnSelectRepo} />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
    
    consoleSpy.mockRestore()
  })
})
