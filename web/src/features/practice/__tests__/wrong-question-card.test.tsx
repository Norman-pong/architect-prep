import { describe, it, expect } from 'vite-plus/test';
import { render } from '@testing-library/react';
import { WrongQuestionCard, type RedoResult } from '../wrong-question-card';
import type { WrongQuestion } from '../types';

function makeWrongQuestion(): WrongQuestion {
  return {
    id: 1,
    user_id: 2,
    question_id: 101,
    created_at: '2026-10-20T09:00:00Z',
    question: {
      id: 101,
      chapter_id: 3,
      content: '示例题目',
      question_type: 'single',
      options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'],
      answer_keys: ['B'],
    },
  };
}

const noop = () => {};

describe('WrongQuestionCard (R3)', () => {
  it('locks options and submit while this question is pending', () => {
    const { container } = render(
      <WrongQuestionCard
        wq={makeWrongQuestion()}
        expanded
        pending
        result={undefined}
        selectedKeys={[]}
        onToggleExpand={noop}
        onToggleOption={noop}
        onSubmit={noop}
        onReset={noop}
        onCollapse={noop}
      />,
    );
    const optionButtons = [...container.querySelectorAll('button')].filter((b) =>
      /^[A-D]\. /.test(b.textContent.trim()),
    );
    expect(optionButtons).toHaveLength(4);
    expect(optionButtons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    const submit = [...container.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === '提交中...',
    ) as HTMLButtonElement | undefined;
    expect(submit?.disabled).toBe(true);
  });

  it('highlights the submitted answer snapshot, not later selection edits', () => {
    const result: RedoResult = {
      is_correct: true,
      correct_answer_keys: ['B'],
      explanation: '解析',
      submitted_keys: ['B'],
    };
    const { container } = render(
      <WrongQuestionCard
        wq={makeWrongQuestion()}
        expanded
        pending={false}
        result={result}
        // Later edits on another card would move this to 'A'; the card must
        // keep rendering the snapshot captured at submit time.
        selectedKeys={['A']}
        onToggleExpand={noop}
        onToggleOption={noop}
        onSubmit={noop}
        onReset={noop}
        onCollapse={noop}
      />,
    );
    const optionB = [...container.querySelectorAll('button')].find((b) =>
      b.textContent.trim().startsWith('B. '),
    );
    const optionA = [...container.querySelectorAll('button')].find((b) =>
      b.textContent.trim().startsWith('A. '),
    );
    expect(optionB).toHaveClass('border-success');
    expect(optionA).not.toHaveClass('border-destructive');
    expect(container.textContent).toContain('已订正');
  });
});
