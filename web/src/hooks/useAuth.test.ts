import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

const fetchCurrentUserMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('../lib/authApi', () => ({
  fetchCurrentUser: (...args: unknown[]) => fetchCurrentUserMock(...args),
  logoutUser: (...args: unknown[]) => logoutMock(...args),
  getLoginUrl: () => '/api/auth/login',
}));

describe('useAuth', () => {
  beforeEach(() => {
    fetchCurrentUserMock.mockResolvedValue({
      user: {
        id: 'u_1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
    logoutMock.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads current user on mount', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('logs out and clears auth state', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
