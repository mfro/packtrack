import { clone, type Operation } from 'packtrack-common';
import { state, type GlobalState } from './localStorage';
import { toRaw } from 'vue';

interface UndoEntry {
  state: GlobalState,
}

const undoStack: UndoEntry[] = [];
const redoStack: UndoEntry[] = [];

function makeRestorePoint() {
  return {
    state: clone(toRaw(state.value)),
  };
}

export function markRestorePoint() {
  undoStack.push(makeRestorePoint());

  redoStack.length = 0;
}

export function undo() {
  const entry = undoStack.pop();
  if (entry) {
    redoStack.push(makeRestorePoint());
    state.value = entry.state;
  }
}

export function redo() {
  const entry = redoStack.pop();
  if (entry) {
    undoStack.push(makeRestorePoint());
    state.value = entry.state;
  }
}

export function apply<A extends unknown[]>(op: Operation<A>, ...args: A) {
  op.impl(state.value.library, ...args);
}
