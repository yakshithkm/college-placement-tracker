import React from 'react';
import { Calculator, Puzzle, BookOpen, Code2, Target, ClipboardList } from 'lucide-react';

const ICON_MAP = {
  'Quantitative Aptitude': Calculator,
  'Logical Reasoning': Puzzle,
  'Verbal Ability': BookOpen,
  'Programming MCQs': Code2,
  'General Aptitude': Target,
};

export function getCategoryIcon(categoryName, props = {}) {
  const Icon = ICON_MAP[categoryName] || ClipboardList;
  return <Icon size={props.size ?? 18} {...props} />;
}

export default getCategoryIcon;