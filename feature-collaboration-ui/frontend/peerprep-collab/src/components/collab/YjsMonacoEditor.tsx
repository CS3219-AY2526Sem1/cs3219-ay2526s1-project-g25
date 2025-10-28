"use client";

import { Editor } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';
import * as Y from 'yjs';

interface YjsMonacoEditorProps {
  language: string;
  ydoc: Y.Doc;
  provider: any;
}

export default function YjsMonacoEditor({ 
  language,
  ydoc,
  provider
}: YjsMonacoEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor options for better experience
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 20,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      theme: 'vs-dark',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: { enabled: true },
      hover: { enabled: true },
      contextmenu: true,
    });

    // Enhanced language support with common keywords and suggestions
    setupLanguageSupport(monaco, language);

    // Add keyboard shortcuts for formatting
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // Yjs is handled by the provider - Monaco will stay in sync through onChange
  };

  // Enhanced language support function
  const setupLanguageSupport = (monaco: any, lang: string) => {
    // Language-specific keyword suggestions
    const languageKeywords: Record<string, string[]> = {
      python: [
        'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
        'import', 'from', 'as', 'with', 'lambda', 'return', 'yield', 'break', 'continue',
        'pass', 'raise', 'assert', 'global', 'nonlocal', 'True', 'False', 'None',
        'and', 'or', 'not', 'is', 'in', 'print', 'len', 'range', 'enumerate', 'zip',
        'map', 'filter', 'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round',
        'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'type'
      ],
      javascript: [
        'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'switch',
        'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally',
        'throw', 'new', 'this', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined',
        'console', 'log', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math',
        'parseInt', 'parseFloat', 'isNaN', 'JSON', 'stringify', 'parse', 'setTimeout'
      ],
      typescript: [
        'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'switch',
        'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally',
        'throw', 'new', 'this', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined',
        'interface', 'type', 'class', 'extends', 'implements', 'public', 'private', 'protected',
        'readonly', 'static', 'abstract', 'string', 'number', 'boolean', 'any', 'void'
      ],
      java: [
        'public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface',
        'extends', 'implements', 'import', 'package', 'if', 'else', 'for', 'while', 'do',
        'switch', 'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally',
        'throw', 'throws', 'new', 'this', 'super', 'null', 'true', 'false', 'void',
        'int', 'long', 'short', 'byte', 'double', 'float', 'char', 'boolean', 'String',
        'System', 'out', 'println', 'print', 'main', 'args', 'length', 'equals', 'toString'
      ],
      cpp: [
        'include', 'using', 'namespace', 'std', 'int', 'char', 'float', 'double', 'bool',
        'void', 'auto', 'const', 'static', 'extern', 'inline', 'virtual', 'override',
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
        'return', 'try', 'catch', 'throw', 'new', 'delete', 'this', 'nullptr', 'true', 'false',
        'cout', 'cin', 'endl', 'string', 'vector', 'map', 'set', 'pair', 'make_pair',
        'sort', 'find', 'push_back', 'size', 'empty', 'begin', 'end', 'iterator'
      ],
      c: [
        'include', 'define', 'if', 'ifdef', 'ifndef', 'endif', 'else', 'elif',
        'int', 'char', 'float', 'double', 'void', 'short', 'long', 'signed', 'unsigned',
        'const', 'static', 'extern', 'auto', 'register', 'volatile', 'typedef', 'struct',
        'union', 'enum', 'sizeof', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
        'default', 'break', 'continue', 'return', 'goto', 'printf', 'scanf', 'malloc',
        'free', 'strlen', 'strcpy', 'strcmp', 'strcat', 'memset', 'memcpy', 'NULL'
      ],
      csharp: [
        'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const', 'class',
        'interface', 'struct', 'enum', 'namespace', 'using', 'if', 'else', 'for', 'foreach',
        'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'try',
        'catch', 'finally', 'throw', 'new', 'this', 'base', 'null', 'true', 'false', 'void',
        'int', 'long', 'short', 'byte', 'double', 'float', 'decimal', 'char', 'bool', 'string',
        'Console', 'WriteLine', 'ReadLine', 'Main', 'args', 'Length', 'ToString', 'Equals'
      ],
      go: [
        'package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface',
        'map', 'slice', 'chan', 'select', 'go', 'defer', 'if', 'else', 'for', 'range',
        'switch', 'case', 'default', 'fallthrough', 'break', 'continue', 'return',
        'goto', 'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16',
        'uint32', 'uint64', 'float32', 'float64', 'string', 'bool', 'byte', 'rune',
        'true', 'false', 'nil', 'make', 'new', 'len', 'cap', 'append', 'copy', 'delete'
      ],
      rust: [
        'fn', 'let', 'mut', 'const', 'static', 'if', 'else', 'match', 'for', 'while',
        'loop', 'break', 'continue', 'return', 'struct', 'enum', 'trait', 'impl', 'use',
        'mod', 'pub', 'crate', 'extern', 'type', 'where', 'unsafe', 'async', 'await',
        'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'f32', 'f64', 'bool',
        'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Some', 'None', 'Ok', 'Err'
      ],
      php: [
        'function', 'class', 'interface', 'trait', 'extends', 'implements', 'use', 'namespace',
        'public', 'private', 'protected', 'static', 'final', 'abstract', 'if', 'else', 'elseif',
        'for', 'foreach', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
        'return', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'parent', 'self',
        'true', 'false', 'null', 'array', 'echo', 'print', 'var_dump', 'isset', 'empty'
      ],
      ruby: [
        'def', 'class', 'module', 'if', 'elsif', 'else', 'unless', 'case', 'when', 'for',
        'while', 'until', 'do', 'break', 'next', 'return', 'yield', 'begin', 'rescue',
        'ensure', 'end', 'true', 'false', 'nil', 'self', 'super', 'puts', 'print', 'p',
        'require', 'include', 'extend', 'attr_reader', 'attr_writer', 'attr_accessor'
      ],
      swift: [
        'func', 'var', 'let', 'class', 'struct', 'enum', 'protocol', 'extension', 'if',
        'else', 'guard', 'for', 'while', 'repeat', 'switch', 'case', 'default', 'break',
        'continue', 'return', 'throw', 'try', 'catch', 'do', 'import', 'public', 'private',
        'internal', 'fileprivate', 'static', 'final', 'override', 'mutating', 'true', 'false',
        'nil', 'self', 'Self', 'super', 'Int', 'Double', 'Float', 'String', 'Bool', 'Array'
      ],
      kotlin: [
        'fun', 'val', 'var', 'class', 'interface', 'object', 'enum', 'data', 'sealed',
        'abstract', 'open', 'final', 'override', 'if', 'else', 'when', 'for', 'while',
        'do', 'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally', 'import',
        'package', 'public', 'private', 'protected', 'internal', 'true', 'false', 'null',
        'this', 'super', 'Int', 'Long', 'Double', 'Float', 'Boolean', 'String', 'Unit'
      ]
    };

    // Register completion provider for the language
    if (languageKeywords[lang]) {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model: any, position: any) => {
          const suggestions = languageKeywords[lang].map((keyword: string) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: `${lang} keyword`,
          }));

          return { suggestions };
        }
      });
    }
  };

  // Cleanup when component unmounts (if needed)
  useEffect(() => {
    return () => {
      // Any cleanup needed
    };
  }, []);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 20,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          renderLineHighlight: 'line',
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          wordBasedSuggestions: 'allDocuments',
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showWords: true,
          }
        }}
      />
    </div>
  );
}
