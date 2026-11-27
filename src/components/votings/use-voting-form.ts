'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import {
  createVotingAction,
  updateVotingAction,
} from '@/actions/voting/admin-votings';
import { toLocalDateTimeInput } from '@/lib/shared/utils/local-date';
import {
  MAX_QUESTIONS,
  VOTING_PATHS,
} from '@/lib/voting/rules/voting-constants';

export interface VotingFormValues {
  votingId?: string;
  hoaId: string;
  title: string;
  description: string;
  endsAt: string | null;
  questions: string[];
}

export interface QuestionField {
  key: number;
  text: string;
}

const SAVE_ERROR = 'Nie udało się zapisać głosowania';

export function useVotingForm(initial: VotingFormValues) {
  const router = useRouter();
  const seed = initial.questions.length > 0 ? initial.questions : [''];
  const nextKey = useRef(seed.length);
  const [hoaId, setHoaId] = useState(initial.hoaId);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [endsAt, setEndsAt] = useState(
    initial.endsAt ? toLocalDateTimeInput(new Date(initial.endsAt)) : ''
  );
  const [questions, setQuestions] = useState<QuestionField[]>(() =>
    seed.map((text, key) => ({ key, text }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddQuestion = questions.length < MAX_QUESTIONS;

  function addQuestion() {
    if (!canAddQuestion) return;
    setQuestions((current) => [
      ...current,
      { key: nextKey.current++, text: '' },
    ]);
  }

  function changeQuestion(key: number, text: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.key === key ? { ...question, text } : question
      )
    );
  }

  function removeQuestion(key: number) {
    setQuestions((current) =>
      current.filter((question) => question.key !== key)
    );
  }

  function moveQuestion(key: number, offset: -1 | 1) {
    setQuestions((current) => {
      const from = current.findIndex((question) => question.key === key);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= current.length) return current;

      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        hoaId,
        title,
        description,
        // A datetime-local value has no zone; the browser's zone is the admin's
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        questions: questions.map(({ text }) => ({ text })),
      };
      const result = initial.votingId
        ? await updateVotingAction({ ...payload, votingId: initial.votingId })
        : await createVotingAction(payload);

      if (!result.ok) {
        setError(result.error || SAVE_ERROR);
        return;
      }

      router.push(`${VOTING_PATHS.admin}/${result.data.id}`);
      router.refresh();
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return {
    fields: { hoaId, title, description, endsAt, questions },
    setHoaId,
    setTitle,
    setDescription,
    setEndsAt,
    addQuestion,
    changeQuestion,
    removeQuestion,
    moveQuestion,
    canAddQuestion,
    canRemoveQuestion: questions.length > 1,
    saving,
    error,
    submit,
  } as const;
}
