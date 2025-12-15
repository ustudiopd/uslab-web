'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { JSONContent } from 'novel';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'offline';

interface UseAutoSaveOptions {
  docId: string;
  debounceMs?: number;
  onSave?: (content: JSONContent, title?: string) => Promise<void>;
}

/**
 * 자동저장 훅
 * - debounce 기반 자동 저장
 * - localStorage 백업
 * - 저장 상태 관리
 */
export function useAutoSave({
  docId,
  debounceMs = 2000,
  onSave,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(navigator.onLine);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      setSaveStatus((prev) => (prev === 'offline' ? 'saved' : prev));
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      setSaveStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // localStorage 백업 키
  const getBackupKey = useCallback(
    (type: 'content' | 'title') => `exec-doc-${docId}-${type}`,
    [docId]
  );

  // localStorage 백업
  const backupToLocal = useCallback(
    (content: JSONContent, title?: string) => {
      try {
        localStorage.setItem(getBackupKey('content'), JSON.stringify(content));
        if (title) {
          localStorage.setItem(getBackupKey('title'), title);
        }
      } catch (error) {
        console.error('Error backing up to localStorage:', error);
      }
    },
    [getBackupKey]
  );

  // localStorage에서 복원
  const restoreFromLocal = useCallback((): { content: JSONContent | null; title: string | null } => {
    try {
      const contentStr = localStorage.getItem(getBackupKey('content'));
      const title = localStorage.getItem(getBackupKey('title'));
      return {
        content: contentStr ? JSON.parse(contentStr) : null,
        title,
      };
    } catch (error) {
      console.error('Error restoring from localStorage:', error);
      return { content: null, title: null };
    }
  }, [getBackupKey]);

  // 저장 실행
  const performSave = useCallback(
    async (content: JSONContent, title?: string) => {
      if (!isOnlineRef.current) {
        setSaveStatus('offline');
        backupToLocal(content, title);
        return;
      }

      if (!onSave) {
        backupToLocal(content, title);
        return;
      }

      setSaveStatus('saving');

      try {
        await onSave(content, title);
        setSaveStatus('saved');
        setLastSaved(new Date());
        backupToLocal(content, title);
      } catch (error) {
        console.error('Error saving:', error);
        setSaveStatus('error');
        backupToLocal(content, title);
      }
    },
    [onSave, backupToLocal]
  );

  // 자동저장 트리거 (debounce)
  const triggerSave = useCallback(
    (content: JSONContent, title?: string) => {
      // 기존 타이머 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 즉시 localStorage 백업
      backupToLocal(content, title);

      // debounce 후 서버 저장
      timeoutRef.current = setTimeout(() => {
        performSave(content, title);
      }, debounceMs);
    },
    [debounceMs, backupToLocal, performSave]
  );

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    triggerSave,
    restoreFromLocal,
    performSave, // 수동 저장 (즉시)
  };
}

