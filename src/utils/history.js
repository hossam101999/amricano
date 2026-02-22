export const initialHistoryState = { entries: [], index: -1 };

export function historyReducer(state, action) {
  switch (action.type) {
    case 'reset': {
      const people = Array.isArray(action.people) ? action.people : [];
      return { entries: [people], index: 0 };
    }
    case 'record': {
      const prevPeople = Array.isArray(action.prev)
        ? action.prev
        : state.entries[state.index] || [];
      const nextPeople = Array.isArray(action.next) ? action.next : [];
      const base = state.entries.length ? state.entries.slice(0, state.index + 1) : [prevPeople];
      const entries = [...base, nextPeople];
      return { entries, index: entries.length - 1 };
    }
    case 'set-index':
      return { ...state, index: action.index };
    default:
      return state;
  }
}
