import { Mark } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    small: {
      /**
       * Set a small mark
       */
      setSmall: () => ReturnType;
      /**
       * Toggle a small mark
       */
      toggleSmall: () => ReturnType;
      /**
       * Unset a small mark
       */
      unsetSmall: () => ReturnType;
    };
  }
}

export const Small = Mark.create({
  name: 'small',

  parseHTML() {
    return [
      {
        tag: 'small',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['small', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setSmall:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleSmall:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetSmall:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-S': () => this.editor.commands.toggleSmall(),
    };
  },
});


