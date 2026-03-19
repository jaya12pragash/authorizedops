'use client';

import { useState, type FormEvent } from 'react';

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export default function PromptForm({ onSubmit, isLoading }: PromptFormProps) {
  const [prompt, setPrompt] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        rows={4}
        placeholder="Example: Prepare my daily engineering update"
        disabled={isLoading}
        maxLength={1000}
        aria-label="Agent prompt"
      />
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Planning…' : 'Run Agent'}
        </button>
        <span className="text-xs text-gray-400">{prompt.length} / 1000</span>
      </div>
    </form>
  );
}
