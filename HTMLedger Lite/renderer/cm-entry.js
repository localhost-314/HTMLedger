import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

const langCompartment     = new Compartment();
const themeCompartment    = new Compartment();
const fontCompartment     = new Compartment();
const editableCompartment = new Compartment();

function langForFile(name) {
  if (/\.(html?|svg|xml)$/i.test(name)) return html();
  if (/\.css$/i.test(name)) return css();
  if (/\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(name)) return javascript({ jsx: /\.[jt]sx$/i.test(name) });
  return html();
}

function fontSizeTheme(px) {
  return EditorView.theme({ '&': { fontSize: px + 'px' }, '.cm-content': { fontFamily: "'Cascadia Code', Consolas, monospace" } });
}

function createEditor({ parent, doc, fileName, dark, fontSize, onChange }) {
  const state = EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      langCompartment.of(langForFile(fileName)),
      themeCompartment.of(dark ? oneDark : []),
      fontCompartment.of(fontSizeTheme(fontSize || 14)),
      editableCompartment.of(EditorView.editable.of(false)),
      EditorView.updateListener.of(update => {
        if (update.docChanged && onChange) onChange(update.state.doc.toString());
      })
    ]
  });
  return new EditorView({ state, parent });
}

window.CM = {
  createEditor,
  setLanguage(view, fileName) { view.dispatch({ effects: langCompartment.reconfigure(langForFile(fileName)) }); },
  setTheme(view, dark) { view.dispatch({ effects: themeCompartment.reconfigure(dark ? oneDark : []) }); },
  setFontSize(view, px) { view.dispatch({ effects: fontCompartment.reconfigure(fontSizeTheme(px)) }); },
  setDoc(view, doc) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } });
  },
  setEditable(view, editable) {
    view.dispatch({ effects: editableCompartment.reconfigure(EditorView.editable.of(editable)) });
  },
  getDoc(view) { return view.state.doc.toString(); }
};
