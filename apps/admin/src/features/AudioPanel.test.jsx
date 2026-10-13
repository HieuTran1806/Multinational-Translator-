import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AudioPanel from './AudioPanel.jsx';

const translation = { contentVersion: 2, currentAudio: null, latestJob: null };

describe('AudioPanel', () => {
  it('asks to save content first when the language has no content', () => {
    render(<AudioPanel poiId={1} lang="en" translation={undefined} ttsStatus={{ configured: true }} />);
    expect(screen.getByText(/Lưu nội dung ngôn ngữ này trước/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Google TTS/ })).not.toBeInTheDocument();
  });

  it('disables TTS and explains why when the server has no Google credentials', () => {
    render(<AudioPanel poiId={1} lang="vi" translation={translation} ttsStatus={{ configured: false }} />);
    expect(screen.getByRole('button', { name: /Google TTS/ })).toBeDisabled();
    expect(screen.getByText(/chưa được cấu hình/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tải audio lên/ })).toBeEnabled();
  });

  it('blocks audio actions while the text has unsaved changes', () => {
    render(<AudioPanel poiId={1} lang="vi" translation={translation} ttsStatus={{ configured: true }} dirty />);
    expect(screen.getByRole('button', { name: /Tải audio lên/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Google TTS/ })).toBeDisabled();
  });

  it('shows processing state for an active job of the current version', () => {
    const job = { id: 5, status: 'RUNNING', contentVersion: 2, attempts: 1, maxAttempts: 3 };
    render(
      <AudioPanel poiId={1} lang="vi" translation={{ ...translation, latestJob: job }} ttsStatus={{ configured: true }} />,
    );
    expect(screen.getByText(/Đang xử lý TTS/)).toBeInTheDocument();
  });

  it('ignores a failed job that belongs to an older content version', () => {
    const job = { id: 5, status: 'FAILED', contentVersion: 1, errorCode: 'X', attempts: 3, maxAttempts: 3 };
    render(
      <AudioPanel poiId={1} lang="vi" translation={{ ...translation, latestJob: job }} ttsStatus={{ configured: true }} />,
    );
    expect(screen.queryByText(/thất bại/)).not.toBeInTheDocument();
    expect(screen.getByTestId('no-audio')).toBeInTheDocument();
  });
});
