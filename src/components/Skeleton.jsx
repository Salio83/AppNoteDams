import React from 'react';
import clsx from 'clsx';

// Base skeleton with shimmer animation
const Skeleton = ({ className, ...props }) => (
    <div
        className={clsx(
            'animate-pulse bg-slate-200 dark:bg-slate-700 rounded',
            className
        )}
        {...props}
    />
);

// Text line skeleton
const SkeletonText = ({ lines = 1, className }) => (
    <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className={clsx(
                    'h-4',
                    i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
                )}
            />
        ))}
    </div>
);

// Card skeleton
const SkeletonCard = ({ className }) => (
    <div className={clsx(
        'bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700',
        className
    )}>
        <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
    </div>
);

// Stats card skeleton (for dashboard)
const SkeletonStatCard = () => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between">
            <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
    </div>
);

// Table row skeleton
const SkeletonTableRow = ({ columns = 4 }) => (
    <tr className="border-b border-slate-100 dark:border-slate-700">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="py-3 px-4">
                <Skeleton className={clsx('h-4', i === 0 ? 'w-32' : 'w-16')} />
            </td>
        ))}
    </tr>
);

// List item skeleton
const SkeletonListItem = () => (
    <div className="flex items-center gap-3 py-3 px-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    </div>
);

// Schedule event skeleton
const SkeletonScheduleEvent = () => (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
        </div>
    </div>
);

// Full dashboard skeleton
const SkeletonDashboard = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>

        {/* Quick cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 p-5 rounded-xl animate-pulse">
                <Skeleton className="h-3 w-24 mb-3 bg-slate-300 dark:bg-slate-600" />
                <Skeleton className="h-5 w-3/4 mb-2 bg-slate-300 dark:bg-slate-600" />
                <Skeleton className="h-4 w-1/2 bg-slate-300 dark:bg-slate-600" />
            </div>
            <SkeletonCard />
            <SkeletonCard />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
        </div>

        {/* UE Grid */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    </div>
);

// Full schedule skeleton
const SkeletonSchedule = () => (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, dayIndex) => (
                <div key={dayIndex} className="space-y-2">
                    <Skeleton className="h-6 w-full mb-4" />
                    {Array.from({ length: 3 }).map((_, eventIndex) => (
                        <SkeletonScheduleEvent key={eventIndex} />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export {
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonStatCard,
    SkeletonTableRow,
    SkeletonListItem,
    SkeletonScheduleEvent,
    SkeletonDashboard,
    SkeletonSchedule
};

export default Skeleton;
