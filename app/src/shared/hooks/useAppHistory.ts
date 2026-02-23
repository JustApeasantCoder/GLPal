import { useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';

export type ModalType = 'settings' | 'importExport' | null;

interface HistoryState {
  tab: string;
  modal: ModalType;
  index: number;
}

export function useAppHistory<T extends string>(
  activeTab: T,
  setActiveTab: Dispatch<SetStateAction<T>>,
  activeModal: ModalType,
  setActiveModal: Dispatch<SetStateAction<ModalType>>
) {
  const historyStack = useRef<HistoryState[]>([]);
  const currentIndex = useRef(0);
  const isInitialMount = useRef(true);
  const ignoreNextPopState = useRef(false);

  const pushState = useCallback((tab: string, modal: ModalType = null) => {
    const state: HistoryState = { tab, modal, index: currentIndex.current + 1 };
    
    historyStack.current = historyStack.current.slice(0, currentIndex.current);
    historyStack.current.push(state);
    currentIndex.current = state.index;
    
    window.history.pushState(state, '', `#${tab}${modal ? `/${modal}` : ''}`);
  }, []);

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (ignoreNextPopState.current) {
      ignoreNextPopState.current = false;
      return;
    }

    const state = event.state as HistoryState | null;

    if (state && state.index !== undefined) {
      if (state.index < currentIndex.current) {
        currentIndex.current = state.index;
        const prevState = historyStack.current.find(s => s.index === state.index);
        if (prevState) {
          if (prevState.modal && !activeModal) {
            setActiveModal(prevState.modal);
          } else if (!prevState.modal && activeModal) {
            setActiveModal(null);
          } else if (prevState.tab !== activeTab) {
            setActiveTab(prevState.tab as T);
          }
        }
      } else if (state.index > currentIndex.current) {
        const nextState = historyStack.current.find(s => s.index === state.index);
        if (nextState) {
          currentIndex.current = state.index;
          setActiveTab(nextState.tab as T);
          setActiveModal(nextState.modal);
        }
      }
    } else if (!state) {
      if (activeModal) {
        ignoreNextPopState.current = true;
        setActiveModal(null);
        pushState(activeTab, null);
      } else if (historyStack.current.length > 1) {
        ignoreNextPopState.current = true;
        currentIndex.current = Math.max(0, currentIndex.current - 1);
        const prevState = historyStack.current[currentIndex.current - 1];
        if (prevState) {
          setActiveTab(prevState.tab as T);
        }
      }
    }
  }, [activeTab, activeModal, setActiveModal, setActiveTab, pushState]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);

    if (isInitialMount.current) {
      isInitialMount.current = false;
      const initialState: HistoryState = { 
        tab: activeTab as string, 
        modal: activeModal, 
        index: 0 
      };
      historyStack.current = [initialState];
      currentIndex.current = 0;
      window.history.replaceState(initialState, '', `#${activeTab}`);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState, activeTab, activeModal]);

  useEffect(() => {
    if (isInitialMount.current) return;
    pushState(activeTab, activeModal);
  }, [activeTab, activeModal, pushState]);

  const openModal = useCallback((modal: ModalType) => {
    ignoreNextPopState.current = true;
    setActiveModal(modal);
    pushState(activeTab, modal);
  }, [activeTab, setActiveModal, pushState]);

  const closeModal = useCallback(() => {
    ignoreNextPopState.current = true;
    setActiveModal(null);
    pushState(activeTab, null);
  }, [activeTab, setActiveModal, pushState]);

  return { openModal, closeModal };
}
