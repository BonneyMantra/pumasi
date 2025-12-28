'use client';

import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { formatEther, parseEther } from 'viem';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  JobCategory,
  JobFilters as IJobFilters,
  JobStatus,
} from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

interface JobFiltersProps {
  filters: IJobFilters;
  onFiltersChange: (filters: IJobFilters) => void;
}

const ALL_CATEGORIES: JobCategory[] = [
  'translation', 'design', 'writing', 'development',
  'tutoring', 'data_entry', 'delivery', 'misc',
];

const ALL_STATUSES: JobStatus[] = ['open', 'in_progress', 'completed'];

const MAX_BUDGET = 1000; // In VERY tokens

export function JobFilters({ filters, onFiltersChange }: JobFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const { t } = useTranslation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const handleCategoryToggle = (category: JobCategory) => {
    const categories = filters.categories || [];
    const newCategories = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];
    onFiltersChange({ ...filters, categories: newCategories.length ? newCategories : undefined });
  };

  const handleStatusToggle = (status: JobStatus) => {
    const statuses = filters.status || [];
    const newStatuses = statuses.includes(status)
      ? statuses.filter((s) => s !== status)
      : [...statuses, status];
    onFiltersChange({ ...filters, status: newStatuses.length ? newStatuses : undefined });
  };

  const handleBudgetChange = (values: number[]) => {
    const [min, max] = values;
    onFiltersChange({
      ...filters,
      minBudget: min > 0 ? parseEther(min.toString()) : undefined,
      maxBudget: max < MAX_BUDGET ? parseEther(max.toString()) : undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.categories?.length ||
    filters.status?.length ||
    filters.minBudget ||
    filters.maxBudget ||
    filters.search;

  const minBudget = filters.minBudget ? Number(formatEther(filters.minBudget)) : 0;
  const maxBudget = filters.maxBudget ? Number(formatEther(filters.maxBudget)) : MAX_BUDGET;

  return (
    <div className="space-y-4">
      {/* Search bar - always visible */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('jobs.search')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
        <MobileFilters
          filters={filters}
          onCategoryToggle={handleCategoryToggle}
          onStatusToggle={handleStatusToggle}
          onBudgetChange={handleBudgetChange}
          onClear={handleClearFilters}
          minBudget={minBudget}
          maxBudget={maxBudget}
          hasActiveFilters={!!hasActiveFilters}
        />
      </form>

      {/* Desktop filters */}
      <div className="hidden lg:block">
        <DesktopFilters
          filters={filters}
          onCategoryToggle={handleCategoryToggle}
          onStatusToggle={handleStatusToggle}
          onBudgetChange={handleBudgetChange}
          onClear={handleClearFilters}
          minBudget={minBudget}
          maxBudget={maxBudget}
          hasActiveFilters={!!hasActiveFilters}
        />
      </div>
    </div>
  );
}

interface FilterControlsProps {
  filters: IJobFilters;
  onCategoryToggle: (category: JobCategory) => void;
  onStatusToggle: (status: JobStatus) => void;
  onBudgetChange: (values: number[]) => void;
  onClear: () => void;
  minBudget: number;
  maxBudget: number;
  hasActiveFilters: boolean;
}

function DesktopFilters(props: FilterControlsProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-6">
      <FilterContent {...props} />
    </div>
  );
}

function MobileFilters(props: FilterControlsProps) {
  const { t } = useTranslation();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden shrink-0 relative">
          <SlidersHorizontal className="h-4 w-4" />
          {props.hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-sky" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>{t('jobs.filter')}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContent {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterContent({
  filters,
  onCategoryToggle,
  onStatusToggle,
  onBudgetChange,
  onClear,
  minBudget,
  maxBudget,
  hasActiveFilters,
}: FilterControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{t('jobs.category')}</h4>
        <div className="grid grid-cols-2 gap-2">
          {ALL_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.categories?.includes(category) || false}
                onCheckedChange={() => onCategoryToggle(category)}
              />
              <span className="text-sm">{t(`jobCategory.${category}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{t('jobs.status')}</h4>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.status?.includes(status) || false}
                onCheckedChange={() => onStatusToggle(status)}
              />
              <span className="text-sm">{t(`jobStatus.${status}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{t('jobs.budget')}</h4>
        <div className="px-2">
          <Slider
            value={[minBudget, maxBudget]}
            min={0}
            max={MAX_BUDGET}
            step={10}
            onValueChange={onBudgetChange}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{minBudget} VERY</span>
            <span>{maxBudget === MAX_BUDGET ? `${MAX_BUDGET}+` : `${maxBudget}`} VERY</span>
          </div>
        </div>
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={onClear}>
          <X className="h-4 w-4 mr-2" />
          {t('jobs.clearFilters')}
        </Button>
      )}
    </div>
  );
}
