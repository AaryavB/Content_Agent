"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TOPIC_SUGGESTIONS } from "@/lib/topicSuggestions";

type StepTopicsProps = {
  topics: string[];
  isSubmitting: boolean;
  error: string | null;
  onTopicChange: (index: number, value: string) => void;
  onContinue: () => void;
};

function countFilledTopics(topics: string[]): number {
  return topics.filter((topic) => topic.trim().length > 0).length;
}

function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

export function StepTopics({
  topics,
  isSubmitting,
  error,
  onTopicChange,
  onContinue,
}: StepTopicsProps) {
  const [suggestionValue, setSuggestionValue] = useState("");
  const filledCount = countFilledTopics(topics);
  const canContinue = filledCount >= 3 && filledCount <= 4 && !isSubmitting;

  const usedTopics = new Set(
    topics.map((topic) => normalizeTopic(topic)).filter(Boolean),
  );

  const availableSuggestions = TOPIC_SUGGESTIONS.filter(
    (suggestion) => !usedTopics.has(normalizeTopic(suggestion)),
  );

  function handleSuggestionSelect(value: string) {
    if (!value) {
      return;
    }

    const emptyIndex = topics.findIndex((topic) => topic.trim().length === 0);
    if (emptyIndex === -1) {
      setSuggestionValue("");
      return;
    }

    onTopicChange(emptyIndex, value);
    setSuggestionValue("");
  }

  return (
    <div className="space-y-8">
      <CardHeader
        title="Topics"
        description="What topics do you usually write or think about? Add 3–4."
      />

      {availableSuggestions.length > 0 ? (
        <Field
          label="Add from suggestions"
          hint="Pick a suggestion to fill the next empty topic slot."
        >
          <Select
            value={suggestionValue}
            onChange={(event) => handleSuggestionSelect(event.target.value)}
            disabled={isSubmitting || filledCount >= 4}
            placeholder="Choose a topic"
            options={availableSuggestions.map((suggestion) => ({
              value: suggestion,
              label: suggestion,
            }))}
          />
        </Field>
      ) : null}

      <div className="space-y-4">
        {topics.map((topic, index) => (
          <Field key={index} label={`Topic ${index + 1}`}>
            <Input
              type="text"
              value={topic}
              onChange={(event) => onTopicChange(index, event.target.value)}
              placeholder="e.g. Startup building"
            />
          </Field>
        ))}
      </div>

      <p className="text-sm text-muted">{filledCount} of 3–4 topics added</p>

      {error ? <Alert>{error}</Alert> : null}

      <Button onClick={onContinue} disabled={!canContinue}>
        {isSubmitting ? "Saving topics..." : "Continue"}
      </Button>
    </div>
  );
}
