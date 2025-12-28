'use client';

import { Job } from '@/lib/types/job';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileJobsTabProps {
  jobs: Job[];
  isLoading?: boolean;
  emptyMessage: string;
  currentUserAddress?: string;
  onApply?: (jobId: string) => void;
}

export function ProfileJobsTab({
  jobs,
  isLoading,
  emptyMessage,
  currentUserAddress,
  onApply,
}: ProfileJobsTabProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          currentUserAddress={currentUserAddress}
          onApply={onApply}
        />
      ))}
    </div>
  );
}
