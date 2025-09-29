
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
});
