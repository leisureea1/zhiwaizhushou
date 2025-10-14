declare module 'react-quill' {
  import React from 'react';
  
  export interface QuillOptions {
    debug?: string | boolean;
    modules?: any;
    placeholder?: string;
    readOnly?: boolean;
    theme?: string;
    formats?: string[];
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
  }

  export interface UnprivilegedEditor {
    getLength(): number;
    getText(index?: number, length?: number): string;
    getHTML(): string;
    getBounds(index: number, length?: number): any;
    getSelection(focus?: boolean): any;
    getContents(index?: number, length?: number): any;
  }

  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    readOnly?: boolean;
    theme?: string;
    modules?: any;
    formats?: string[];
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
    onChange?(
      content: string,
      delta: any,
      source: string,
      editor: UnprivilegedEditor
    ): void;
    onChangeSelection?(
      range: any,
      source: string,
      editor: UnprivilegedEditor
    ): void;
    onFocus?(
      range: any,
      source: string,
      editor: UnprivilegedEditor
    ): void;
    onBlur?(
      previousRange: any,
      source: string,
      editor: UnprivilegedEditor
    ): void;
    onKeyPress?: React.EventHandler<any>;
    onKeyDown?: React.EventHandler<any>;
    onKeyUp?: React.EventHandler<any>;
    style?: React.CSSProperties;
    className?: string;
    tabIndex?: number;
    preserveWhitespace?: boolean;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {
    focus(): void;
    blur(): void;
    getEditor(): any;
    getEditingArea(): HTMLElement;
  }
}
