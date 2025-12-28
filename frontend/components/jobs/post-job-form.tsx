'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { JobCategory } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

// Job categories for iteration
const JOB_CATEGORIES: JobCategory[] = [
  'translation',
  'design',
  'writing',
  'development',
  'tutoring',
  'data_entry',
  'delivery',
  'misc',
];

export interface PostJobFormData {
  title: string;
  category: JobCategory | '';
  description: string;
  budget: string;
  deadline: Date | undefined;
  paymentType: 'full' | 'milestone';
  requirements: string;
}

interface PostJobFormProps {
  initialData?: Partial<PostJobFormData>;
  onSubmit: (data: PostJobFormData) => void;
  isSubmitting?: boolean;
}

const MIN_BUDGET = 0.001;

export function PostJobForm({ initialData, onSubmit, isSubmitting }: PostJobFormProps) {
  const { t, locale } = useTranslation();
  const [formData, setFormData] = useState<PostJobFormData>({
    title: initialData?.title ?? '',
    category: initialData?.category ?? '',
    description: initialData?.description ?? '',
    budget: initialData?.budget ?? '',
    deadline: initialData?.deadline,
    paymentType: initialData?.paymentType ?? 'full',
    requirements: initialData?.requirements ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PostJobFormData, string>>>({});

  // Sync with initialData when it changes (for demo data prefill)
  useEffect(() => {
    if (initialData?.title || initialData?.description || initialData?.requirements) {
      setFormData((prev) => ({
        ...prev,
        title: initialData.title ?? prev.title,
        description: initialData.description ?? prev.description,
        requirements: initialData.requirements ?? prev.requirements,
        category: initialData.category ?? prev.category,
        budget: initialData.budget ?? prev.budget,
        deadline: initialData.deadline ?? prev.deadline,
        paymentType: initialData.paymentType ?? prev.paymentType,
      }));
    }
  }, [initialData?.title, initialData?.description, initialData?.requirements]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PostJobFormData, string>> = {};

    if (!formData.title || formData.title.length < 5 || formData.title.length > 100) {
      newErrors.title = t('postJobForm.validation.titleLength');
    }

    if (!formData.category) {
      newErrors.category = t('postJobForm.validation.categoryRequired');
    }

    if (!formData.description || formData.description.length < 20 || formData.description.length > 2000) {
      newErrors.description = t('postJobForm.validation.descriptionLength');
    }

    const budgetNum = parseFloat(formData.budget);
    if (!formData.budget || isNaN(budgetNum) || budgetNum < MIN_BUDGET) {
      newErrors.budget = t('postJobForm.validation.budgetMin', { amount: MIN_BUDGET });
    }

    if (!formData.deadline || formData.deadline <= new Date()) {
      newErrors.deadline = t('postJobForm.validation.deadlineFuture');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof PostJobFormData>(key: K, value: PostJobFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t('postJobForm.titleLabel')}</Label>
        <Input
          id="title"
          placeholder={t('postJobForm.titlePlaceholder')}
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          className={cn(errors.title && 'border-destructive')}
          maxLength={100}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {errors.title && <span className="text-destructive">{errors.title}</span>}
          <span className="ml-auto">{formData.title.length}/100</span>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>{t('postJobForm.categoryLabel')}</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => updateField('category', value as JobCategory)}
        >
          <SelectTrigger className={cn(errors.category && 'border-destructive')}>
            <SelectValue placeholder={t('postJobForm.categoryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {JOB_CATEGORIES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`jobCategories.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('postJobForm.descriptionLabel')}</Label>
        <Textarea
          id="description"
          placeholder={t('postJobForm.descriptionPlaceholder')}
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          className={cn('min-h-[120px]', errors.description && 'border-destructive')}
          maxLength={2000}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {errors.description && <span className="text-destructive">{errors.description}</span>}
          <span className="ml-auto">{formData.description.length}/2000</span>
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget">{t('postJobForm.budgetLabel')}</Label>
        <div className="relative">
          <Input
            id="budget"
            type="number"
            placeholder="0.01"
            min={MIN_BUDGET}
            step="0.001"
            value={formData.budget}
            onChange={(e) => updateField('budget', e.target.value)}
            className={cn('pr-16', errors.budget && 'border-destructive')}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            VERY
          </span>
        </div>
        {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <Label>{t('postJobForm.deadlineLabel')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !formData.deadline && 'text-muted-foreground',
                errors.deadline && 'border-destructive'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.deadline ? (
                format(formData.deadline, 'PPP', { locale: locale === 'ko' ? ko : enUS })
              ) : (
                <span>{t('postJobForm.selectDate')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.deadline}
              onSelect={(date) => updateField('deadline', date)}
              disabled={(date) => date <= new Date()}
            />
          </PopoverContent>
        </Popover>
        {errors.deadline && <p className="text-xs text-destructive">{errors.deadline}</p>}
      </div>

      {/* Payment Type */}
      <div className="space-y-3">
        <Label>{t('postJobForm.paymentTypeLabel')}</Label>
        <RadioGroup
          value={formData.paymentType}
          onValueChange={(value) => updateField('paymentType', value as 'full' | 'milestone')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full" id="full" />
            <Label htmlFor="full" className="font-normal cursor-pointer">
              {t('postJobForm.fullPayment')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="milestone" id="milestone" />
            <Label htmlFor="milestone" className="font-normal cursor-pointer">
              {t('postJobForm.milestonePayment')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Requirements */}
      <div className="space-y-2">
        <Label htmlFor="requirements">{t('postJobForm.requirementsLabel')}</Label>
        <Textarea
          id="requirements"
          placeholder={t('postJobForm.requirementsPlaceholder')}
          value={formData.requirements}
          onChange={(e) => updateField('requirements', e.target.value)}
          className="min-h-[80px]"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.requirements.length}/1000
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-sky hover:bg-sky/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('common.processing') : t('postJobForm.nextStep')}
      </Button>
    </form>
  );
}
