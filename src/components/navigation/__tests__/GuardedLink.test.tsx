import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GuardedLink from '../GuardedLink';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPrefetch = vi.fn();
const mockGuardedNavigate = vi.fn((action: () => void) => action());
const mockProgressStart = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
  usePathname: () => '/current',
}));

vi.mock('@/providers/NavigationGuardProvider', () => ({
  useNavigationGuard: () => ({ guardedNavigate: mockGuardedNavigate }),
}));

vi.mock('@/providers/ProgressBarProvider', () => ({
  useProgressBar: () => ({ start: mockProgressStart, done: vi.fn() }),
}));

describe('GuardedLink Component', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockPrefetch.mockClear();
    mockGuardedNavigate.mockClear();
    mockGuardedNavigate.mockImplementation((action: () => void) => action());
    mockProgressStart.mockClear();
  });

  it('renders link with children', () => {
    render(<GuardedLink href="/test">Test Link</GuardedLink>);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('preserves Cmd+Click for new tab', () => {
    render(<GuardedLink href="#test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate Cmd+Click (metaKey)
    fireEvent.click(link, { metaKey: true });
    
    // Should not call guarded navigation
    expect(mockGuardedNavigate).not.toHaveBeenCalled();
  });

  it('preserves Ctrl+Click for new tab', () => {
    render(<GuardedLink href="#test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate Ctrl+Click
    fireEvent.click(link, { ctrlKey: true });
    
    // Should not call guarded navigation
    expect(mockGuardedNavigate).not.toHaveBeenCalled();
  });

  it('preserves middle click', () => {
    render(<GuardedLink href="#test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate middle click (button 1)
    fireEvent.click(link, { button: 1 });
    
    // Should not call guarded navigation
    expect(mockGuardedNavigate).not.toHaveBeenCalled();
  });

  it('calls guardedPush on plain left click', () => {
    render(<GuardedLink href="/test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate plain left click
    fireEvent.click(link);
    
    // Should guard and then push
    expect(mockGuardedNavigate).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/test');
  });

  it('starts navigation feedback only after the guard permits navigation', () => {
    let permittedNavigation: (() => void) | undefined;
    const onNavigationStart = vi.fn();
    mockGuardedNavigate.mockImplementation((action: () => void) => {
      permittedNavigation = action;
    });

    render(
      <GuardedLink href="/test" onNavigationStart={onNavigationStart}>
        Test Link
      </GuardedLink>,
    );
    fireEvent.click(screen.getByText('Test Link'));

    expect(onNavigationStart).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();

    permittedNavigation?.();

    expect(onNavigationStart).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/test');
  });

  it('applies custom className', () => {
    render(
      <GuardedLink href="/test" className="custom-class">
        Test Link
      </GuardedLink>
    );
    const link = screen.getByText('Test Link');
    expect(link).toHaveClass('custom-class');
  });
});
