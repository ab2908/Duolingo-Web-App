"use client";

import { LearningPath, PathEnd } from "@/components/path/LearningPath";
import { ErrorState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

export default function LearnPage() {
  const { data: path, error, reload } = useApi(api.path);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!path) return <Spinner label="Loading your path" />;

  return (
    <>
      <LearningPath path={path} onChange={reload} />
      <PathEnd />
    </>
  );
}
