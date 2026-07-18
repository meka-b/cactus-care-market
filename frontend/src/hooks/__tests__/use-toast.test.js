import { reducer } from '../use-toast';

describe('use-toast reducer', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const initialState = { toasts: [] };

  it('should handle ADD_TOAST and limit to 1 toast (TOAST_LIMIT)', () => {
    const action1 = { type: 'ADD_TOAST', toast: { id: '1', title: 'Toast 1' } };
    const state1 = reducer(initialState, action1);
    expect(state1.toasts).toEqual([{ id: '1', title: 'Toast 1' }]);

    const action2 = { type: 'ADD_TOAST', toast: { id: '2', title: 'Toast 2' } };
    const state2 = reducer(state1, action2);
    // Based on `[action.toast, ...state.toasts].slice(0, TOAST_LIMIT)`, where limit is 1
    expect(state2.toasts).toEqual([{ id: '2', title: 'Toast 2' }]);
  });

  it('should handle UPDATE_TOAST', () => {
    const state = { toasts: [{ id: '1', title: 'Toast 1', open: true }] };
    const action = { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Toast 1 Updated' } };
    const updatedState = reducer(state, action);

    expect(updatedState.toasts).toEqual([{ id: '1', title: 'Toast 1 Updated', open: true }]);
  });

  it('should handle DISMISS_TOAST with a specific toastId', () => {
    const state = {
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true }
      ]
    };
    const action = { type: 'DISMISS_TOAST', toastId: '1' };
    const dismissedState = reducer(state, action);

    expect(dismissedState.toasts).toEqual([
      { id: '1', title: 'Toast 1', open: false },
      { id: '2', title: 'Toast 2', open: true }
    ]);
  });

  it('should handle DISMISS_TOAST without a specific toastId (dismiss all)', () => {
    const state = {
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true }
      ]
    };
    const action = { type: 'DISMISS_TOAST' };
    const dismissedState = reducer(state, action);

    expect(dismissedState.toasts).toEqual([
      { id: '1', title: 'Toast 1', open: false },
      { id: '2', title: 'Toast 2', open: false }
    ]);
  });

  it('should handle REMOVE_TOAST with a specific toastId', () => {
    const state = {
      toasts: [
        { id: '1', title: 'Toast 1', open: false },
        { id: '2', title: 'Toast 2', open: true }
      ]
    };
    const action = { type: 'REMOVE_TOAST', toastId: '1' };
    const removedState = reducer(state, action);

    expect(removedState.toasts).toEqual([
      { id: '2', title: 'Toast 2', open: true }
    ]);
  });

  it('should handle REMOVE_TOAST without a specific toastId (remove all)', () => {
    const state = {
      toasts: [
        { id: '1', title: 'Toast 1', open: false },
        { id: '2', title: 'Toast 2', open: false }
      ]
    };
    const action = { type: 'REMOVE_TOAST' };
    const removedState = reducer(state, action);

    expect(removedState.toasts).toEqual([]);
  });
});
