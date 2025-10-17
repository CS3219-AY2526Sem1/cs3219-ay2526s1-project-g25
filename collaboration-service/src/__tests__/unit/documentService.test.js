
import { applyOp } from '../../services/documentService.js';

describe('document ops', () => {
  test('insert then delete', () => {
    const doc = { version: 0, text: '' };
    applyOp(doc, { type: 'insert', index: 0, text: 'hello', version: 0 });
    expect(doc.text).toBe('hello');
    expect(doc.version).toBe(1);

    applyOp(doc, { type: 'delete', index: 0, length: 2, version: 1 });
    expect(doc.text).toBe('llo');
    expect(doc.version).toBe(2);
  });

  test('error when version mismatch', () => {
    const doc = { version: 0, text: '' };
    expect(() => applyOp(doc, { type: 'insert', index: 0, text: 'hello', version: 1 })).toThrow('version mismatch');
  });

  test('error when inserting out of range', () => {
    const doc = { version: 0, text: '' };
    expect(() => applyOp(doc, { type: 'insert', index: 1, text: 'hello', version: 0 })).toThrow('index out of range');
  });

  test('inserting at the start works as expected', () => {
    const doc = { version: 0, text: '' };
    applyOp(doc, { type: 'insert', index: 0, text: ' world', version: 0 });
    applyOp(doc, { type: 'insert', index: 0, text: 'hello', version: 1 });
    expect(doc.text).toBe('hello world');
    expect(doc.version).toBe(2);
  });

  test('inserting at the end works as expected', () => {
    const doc = { version: 0, text: '' };
    applyOp(doc, { type: 'insert', index: 0, text: 'hello', version: 0 });
    applyOp(doc, { type: 'insert', index: 5, text: ' world', version: 1 });
    expect(doc.text).toBe('hello world');
    expect(doc.version).toBe(2);
  });

  test('error when deleting out of range', () => {
    const doc = { version: 0, text: '' };
    expect(() => applyOp(doc, { type: 'delete', index: 1, length: 0, version: 0 })).toThrow('delete out of range');
  });

  test('deleting length 0 deletes nothing', () => {
    const doc = { version: 0, text: '' };
    applyOp(doc, { type: 'insert', index: 0, text: 'hello', version: 0 });
    applyOp(doc, { type: 'delete', index: 0, length: 0, version: 1 });
    expect(doc.text).toBe('hello');
    expect(doc.version).toBe(2);
  });

  test('deleting length 0 on an empty document deletes nothing', () => {
    const doc = { version: 0, text: '' };
    applyOp(doc, { type: 'delete', index: 0, length: 0, version: 0 });
    expect(doc.text).toBe('');
    expect(doc.version).toBe(1);
  });

  test('deleting max valid length deletes everything', () => {
    const doc = { version: 0, text: '' };
    applyOp(doc, { type: 'insert', index: 0, text: 'hello', version: 0 });
    applyOp(doc, { type: 'delete', index: 0, length: 5, version: 1 });
    expect(doc.text).toBe('');
    expect(doc.version).toBe(2);
  });

  test('deleting over max valid length throws an error', () => {
    const doc = { version: 0, text: '' };
    applyOp(doc, { type: 'insert', index: 0, text: 'hello', version: 0 });
    expect(() => applyOp(doc, { type: 'delete', index: 0, length: 6, version: 1 })).toThrow('delete out of range');
  });

  test('error when invalid operation', () => {
    const doc = { version: 0, text: '' };
    expect(() => applyOp(doc, { type: 'INVALID-OP', version: 0 })).toThrow('unknown op');
  });
});
