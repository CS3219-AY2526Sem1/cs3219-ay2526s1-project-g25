
import { runOnce } from '../../services/executionService.js';

describe('execution mutex', () => {
  test('second call is busy while first is running', async () => {
    const locks = new Map();
    const logs = new Map();
    const sid = 's1';

    const p1 = runOnce(sid, locks, logs, 'print(1)', 'py');
    const p2 = runOnce(sid, locks, logs, 'print(2)', 'py');

    const r1 = await p1;
    const r2 = await p2;

    expect(r1.busy).toBe(false);
    expect(r2.busy).toBe(true);
  });
});
