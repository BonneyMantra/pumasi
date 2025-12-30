'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const TEMPLATE_COUNT = 5;

/**
 * Hook to get demo prefill data based on current language
 * Supports multiple templates per form with random selection
 * All demo data is stored in translation files under the "demo" key
 */
export function useDemoData() {
  const { t } = useTranslation();
  const [templateIndices, setTemplateIndices] = useState<Record<string, number>>({});

  // Initialize random indices on mount
  useEffect(() => {
    setTemplateIndices({
      postJob: Math.floor(Math.random() * TEMPLATE_COUNT),
      apply: Math.floor(Math.random() * TEMPLATE_COUNT),
      evidence: Math.floor(Math.random() * TEMPLATE_COUNT),
      delivery: Math.floor(Math.random() * TEMPLATE_COUNT),
      dispute: Math.floor(Math.random() * TEMPLATE_COUNT),
      vote: Math.floor(Math.random() * TEMPLATE_COUNT),
      revision: Math.floor(Math.random() * TEMPLATE_COUNT),
      review: Math.floor(Math.random() * TEMPLATE_COUNT),
      deliverable: Math.floor(Math.random() * TEMPLATE_COUNT),
    });
  }, []);

  // Function to get next template (cycle through)
  const nextTemplate = useCallback((formType: string) => {
    setTemplateIndices((prev) => ({
      ...prev,
      [formType]: ((prev[formType] || 0) + 1) % TEMPLATE_COUNT,
    }));
  }, []);

  // Function to get random template
  const randomizeTemplate = useCallback((formType: string) => {
    setTemplateIndices((prev) => ({
      ...prev,
      [formType]: Math.floor(Math.random() * TEMPLATE_COUNT),
    }));
  }, []);

  const getTemplateKey = (formType: string) => {
    const idx = templateIndices[formType] ?? 0;
    return `templates.${idx}`;
  };

  const demoData = useMemo(() => {
    const postJobKey = getTemplateKey('postJob');
    const applyKey = getTemplateKey('apply');
    const evidenceKey = getTemplateKey('evidence');
    const deliveryKey = getTemplateKey('delivery');
    const disputeKey = getTemplateKey('dispute');
    const voteKey = getTemplateKey('vote');
    const revisionKey = getTemplateKey('revision');
    const reviewKey = getTemplateKey('review');
    const deliverableKey = getTemplateKey('deliverable');

    return {
      postJob: {
        title: t(`demo.postJob.${postJobKey}.title`),
        description: t(`demo.postJob.${postJobKey}.description`),
        requirements: t(`demo.postJob.${postJobKey}.requirements`),
        budget: t(`demo.postJob.${postJobKey}.budget`),
        category: t(`demo.postJob.${postJobKey}.category`),
      },
      apply: {
        coverLetter: t(`demo.apply.${applyKey}.coverLetter`),
        timeline: t(`demo.apply.${applyKey}.timeline`),
        portfolioLinks: [
          t(`demo.apply.${applyKey}.portfolioLink1`),
          t(`demo.apply.${applyKey}.portfolioLink2`),
        ],
      },
      evidence: {
        description: t(`demo.evidence.${evidenceKey}.description`),
        fileLinks: [
          t(`demo.evidence.${evidenceKey}.fileLink1`),
          t(`demo.evidence.${evidenceKey}.fileLink2`),
        ],
      },
      delivery: {
        description: t(`demo.delivery.${deliveryKey}.description`),
        notes: t(`demo.delivery.${deliveryKey}.notes`),
      },
      dispute: {
        reason: t(`demo.dispute.${disputeKey}.reason`),
        description: t(`demo.dispute.${disputeKey}.description`),
        fileLinks: [
          t(`demo.dispute.${disputeKey}.fileLink1`),
          t(`demo.dispute.${disputeKey}.fileLink2`),
        ],
      },
      vote: {
        rationale: t(`demo.vote.${voteKey}.rationale`),
      },
      revision: {
        reason: t(`demo.revision.${revisionKey}.reason`),
        feedback: t(`demo.revision.${revisionKey}.feedback`),
      },
      review: {
        comment: t(`demo.review.${reviewKey}.comment`),
        rating: parseInt(t(`demo.review.${reviewKey}.rating`)) || 5,
      },
      deliverable: {
        title: t(`demo.deliverable.${deliverableKey}.title`),
        description: t(`demo.deliverable.${deliverableKey}.description`),
        links: t(`demo.deliverable.${deliverableKey}.links`),
      },
    };
  }, [t, templateIndices]);

  return {
    ...demoData,
    nextTemplate,
    randomizeTemplate,
    templateIndices,
  };
}
