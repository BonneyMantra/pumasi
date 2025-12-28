'use client';

import { useState, useMemo } from 'react';
import { Briefcase, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { JobFilters } from '@/components/jobs/job-filters';
import { JobList } from '@/components/jobs/job-list';
import { JobFilters as IJobFilters } from '@/lib/types/job';
import { useJobs } from '@/lib/hooks/use-jobs';
import { useTranslation } from '@/lib/i18n';
import { useAccount } from '@/lib/web3';

const ITEMS_PER_PAGE = 9;

export default function JobsPage() {
  const [filters, setFilters] = useState<IJobFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const { address } = useAccount();

  // Fetch jobs from subgraph
  const { jobs, isLoading, refetch } = useJobs(filters);

  // Paginate jobs
  const { paginatedJobs, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedJobs = jobs.slice(start, start + ITEMS_PER_PAGE);

    return { paginatedJobs, totalPages };
  }, [jobs, currentPage]);

  const handleFiltersChange = (newFilters: IJobFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleApply = (jobId: string) => {
    // Navigate to job detail page with apply modal
    window.location.href = `/jobs/${jobId}?apply=true`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-sky/10 p-2">
            <Briefcase className="h-6 w-6 text-sky" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('jobs.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('jobs.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={isLoading}
            title={t('common.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/jobs/new">
            <Button className="bg-sky hover:bg-sky/90">
              <Plus className="h-4 w-4 mr-2" />
              {t('jobs.postJob')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="lg:col-span-1">
          <JobFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </aside>

        {/* Job list */}
        <main className="lg:col-span-3">
          <JobList
            jobs={paginatedJobs}
            onApply={handleApply}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            currentUserAddress={address}
          />
        </main>
      </div>
    </div>
  );
}
