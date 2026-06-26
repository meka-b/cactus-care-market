import { cn } from '../utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
  });

  it('merges tailwind classes using tailwind-merge', () => {
    // p-4 and p-8 are conflicting padding classes; p-8 should win
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('handles array inputs', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});
