'use client';

import { useState } from 'react';
import { Grid, List, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Job } from '@/lib/types/job';
import { JobCard, JobCardSkeleton } from './job-card';
import { useTranslation } from '@/lib/i18n';

interface JobListProps {
  jobs: Job[];
  isLoading?: boolean;
  onApply?: (jobId: string) => void;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  currentUserAddress?: string;
}

type ViewMode = 'grid' | 'list';

export function JobList({
  jobs,
  isLoading,
  onApply,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  currentUserAddress,
}: JobListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'flex flex-col gap-4'
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return <JobListEmpty />;
  }

  return (
    <div className="space-y-4">
      <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-4'
        }
      >
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onApply={onApply} currentUserAddress={currentUserAddress} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('grid')}
        aria-label={t('jobList.gridView')}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('list')}
        aria-label={t('jobList.listView')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}

function JobListEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Briefcase className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t('jobList.empty.title')}</h3>
      <p className="text-muted-foreground max-w-sm">
        {t('jobList.empty.message')}
      </p>
    </div>
  );
}

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
}

function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = getVisiblePages(pages, currentPage);

  return (
    <div className="flex justify-center items-center gap-1 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange?.(currentPage - 1)}
      >
        {t('common.previous')}
      </Button>

      {visiblePages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange?.(page as number)}
            className={currentPage === page ? 'bg-sky hover:bg-sky/90' : ''}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
      >
        {t('common.next')}
      </Button>
    </div>
  );
}

function getVisiblePages(
  pages: number[],
  current: number
): (number | '...')[] {
  if (pages.length <= 7) return pages;

  if (current <= 3) {
    return [...pages.slice(0, 5), '...', pages[pages.length - 1]];
  }

  if (current >= pages.length - 2) {
    return [pages[0], '...', ...pages.slice(-5)];
  }

  return [
    pages[0],
    '...',
    current - 1,
    current,
    current + 1,
    '...',
    pages[pages.length - 1],
  ];
}
