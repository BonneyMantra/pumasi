'use client';

import Link from 'next/link';
import { Gavel, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ArbitratorRegisterPage() {
  return (
    <div className="container max-w-2xl py-16">
      <Card className="border-dashed">
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 bg-violet/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gavel className="h-10 w-10 text-violet" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Become an Arbitrator</h1>
          <p className="text-lg text-sky mb-2">Coming Soon</p>

          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Arbitrator registration requires a Shinroe score of 700+.
            Stake tokens and help resolve disputes in the community.
          </p>

          <Button asChild variant="outline">
            <Link href="/arbitration">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Arbitration
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
