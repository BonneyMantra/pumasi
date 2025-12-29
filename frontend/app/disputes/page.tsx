'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DisputesPage() {
  return (
    <div className="container max-w-2xl py-16">
      <Card className="border-dashed">
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 bg-violet/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-violet" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Dispute Resolution</h1>
          <p className="text-lg text-sky mb-2">Coming Soon</p>

          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Our decentralized dispute resolution system is under development.
            For now, all transactions are protected by escrow smart contracts.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/jobs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Link>
            </Button>
            <Button asChild className="bg-sky hover:bg-sky/90">
              <Link href="/jobs/active">
                View Active Jobs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
