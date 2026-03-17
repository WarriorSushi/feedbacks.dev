'use client';

import { Badge } from '@/components/ui/badge';
import { ImageLightbox } from '@/components/image-lightbox';
import { ArchiveFeedbackButton } from '@/components/archive-feedback-button';
import { formatDateOnly, formatDateTime } from '@/lib/utils';
import { Mail, Globe, MonitorSmartphone, Tag, Paperclip } from 'lucide-react';

interface FeedbackListProps {
    feedbacks: any[];
}

export function FeedbackList({ feedbacks }: FeedbackListProps) {
    if (!feedbacks || feedbacks.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>No feedback yet.</p>
                <p className="mt-1 text-sm">Install the widget to start collecting feedback!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            {feedbacks.map((fb) => (
                <details key={fb.id} className="group rounded-lg border p-3 sm:p-4">
                    <summary className="list-none cursor-pointer outline-none">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                    <Badge variant={fb.type === 'bug' ? 'destructive' : 'default'}>
                                        {fb.type || 'general'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDateOnly(fb.created_at)}
                                    </span>
                                </div>
                                <p className="line-clamp-2 text-foreground">{fb.message}</p>
                                {fb.email && (
                                    <p className="mt-1 text-sm text-muted-foreground">From: {fb.email}</p>
                                )}
                                {typeof fb.rating === 'number' && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Rating: {fb.rating}/5
                                    </p>
                                )}
                            </div>
                        </div>
                    </summary>
                    <div className="mt-3 space-y-3">
                        {fb.screenshot_url && (
                            <ImageLightbox
                                src={fb.screenshot_url}
                                className="max-h-[85vh] max-w-[95vw]"
                                thumbClassName="h-auto w-full rounded border"
                            />
                        )}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{fb.email || 'anonymous'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                <a href={fb.url} target="_blank" rel="noreferrer" className="truncate underline">
                                    {fb.url}
                                </a>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MonitorSmartphone className="h-4 w-4" />
                                <span className="truncate" title={(fb as any).user_agent}>
                                    {(fb as any).user_agent || 'Unknown UA'}
                                </span>
                            </div>
                            {fb.priority && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag className="h-4 w-4" />
                                    <span>Priority: {fb.priority}</span>
                                </div>
                            )}
                            {Array.isArray((fb as any).tags) && (fb as any).tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                    {(fb as any).tags.map((t: string) => (
                                        <Badge key={t} variant="outline" className="text-xs">
                                            {t}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="text-muted-foreground">
                                Created: {formatDateTime(fb.created_at)}
                            </div>
                        </div>
                        <div>
                            <ArchiveFeedbackButton id={fb.id} />
                        </div>
                        <div>
                            <div className="mb-1 text-sm font-medium">Message</div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {fb.message}
                            </p>
                        </div>
                        {Array.isArray((fb as any).attachments) && (fb as any).attachments.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Attachments</div>
                                <div className="flex flex-wrap gap-2">
                                    {(fb as any).attachments.map((att: any, idx: number) => (
                                        att.type?.startsWith('image/') ? (
                                            <ImageLightbox
                                                key={idx}
                                                src={att.url}
                                                thumbClassName="h-20 w-auto rounded border"
                                            />
                                        ) : (
                                            <a
                                                key={idx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-sm underline"
                                            >
                                                <Paperclip className="h-3 w-3" /> {att.name || 'attachment.pdf'}
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </details>
            ))}
        </div>
    );
}
