'use client';

import { useState } from 'react';
import { Check, MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ReviewType = 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';

type ReviewActionsProps = {
  owner: string;
  repo: string;
  prNumber: number;
  token?: string;
  onReviewSubmitted?: (type: ReviewType) => void;
};

export default function ReviewActions({
  owner,
  repo,
  prNumber,
  token,
  onReviewSubmitted,
}: ReviewActionsProps) {
  const [selectedType, setSelectedType] = useState<ReviewType | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSelectType = (type: ReviewType) => {
    setSelectedType(type);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    if (selectedType === 'REQUEST_CHANGES' && !comment.trim()) {
      setError('A comment is required when requesting changes');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/github/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          prNumber,
          token,
          event: selectedType,
          body: comment.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(
        selectedType === 'APPROVE'
          ? 'Pull request approved!'
          : selectedType === 'COMMENT'
          ? 'Comment submitted!'
          : 'Changes requested!'
      );
      setComment('');
      setSelectedType(null);
      onReviewSubmitted?.(selectedType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    setComment('');
    setError(null);
  };

  return (
    <Card className="border-t-2 border-t-primary/40">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3">
        {success && (
          <div className="bg-green-100 border border-green-200 text-green-700 rounded-md p-2 text-xs">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-2 text-xs">
            {error}
          </div>
        )}

        {/* Review Type Buttons */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={selectedType === 'APPROVE' ? 'default' : 'outline'}
            onClick={() => handleSelectType('APPROVE')}
            className={
              selectedType === 'APPROVE'
                ? 'bg-green-600 hover:bg-green-700 text-white text-xs h-7'
                : 'border-green-600 text-green-600 hover:bg-green-50 text-xs h-7'
            }
            disabled={submitting}
          >
            <Check className="h-3 w-3 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant={selectedType === 'COMMENT' ? 'default' : 'outline'}
            onClick={() => handleSelectType('COMMENT')}
            className="text-xs h-7"
            disabled={submitting}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Comment
          </Button>
          <Button
            size="sm"
            variant={selectedType === 'REQUEST_CHANGES' ? 'destructive' : 'outline'}
            onClick={() => handleSelectType('REQUEST_CHANGES')}
            className={
              selectedType !== 'REQUEST_CHANGES'
                ? 'border-destructive text-destructive hover:bg-destructive/10 text-xs h-7'
                : 'text-xs h-7'
            }
            disabled={submitting}
          >
            <X className="h-3 w-3 mr-1" />
            Request
          </Button>
        </div>

        {/* Comment Input */}
        {selectedType && (
          <div className="space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                selectedType === 'APPROVE'
                  ? 'Comment (optional)'
                  : selectedType === 'COMMENT'
                  ? 'Leave a comment'
                  : 'Describe changes (required)'
              }
              className="w-full h-16 p-2 text-xs border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              disabled={submitting}
            />
            <div className="flex gap-1.5 justify-end">
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={submitting} className="text-xs h-7">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || (selectedType === 'REQUEST_CHANGES' && !comment.trim())}
                className={
                  selectedType === 'APPROVE'
                    ? 'bg-green-600 hover:bg-green-700 text-xs h-7'
                    : selectedType === 'REQUEST_CHANGES'
                    ? 'bg-destructive hover:bg-destructive/90 text-xs h-7'
                    : 'text-xs h-7'
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Submitting
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
