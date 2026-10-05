import React from "react";

export function SkeletonBlock({ className = "", ...props }) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={`skeleton-shimmer rounded-xl ${className}`}
    />
  );
}

export function ButtonSkeleton({ className = "" }) {
  return (
    <SkeletonBlock
      className={`inline-flex h-11 min-w-32 items-center justify-center rounded-xl ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1500px]"
      aria-label="Loading dashboard content"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-4 w-44" />
        </div>
        <div className="mx-auto grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} className="h-16 min-w-28 sm:min-w-36" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(390px,0.95fr)] xl:grid-rows-[auto_minmax(360px,1fr)]">
        <section>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-36" />
              <SkeletonBlock className="h-10 w-52" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
            <ButtonSkeleton className="h-10 w-32 min-w-0" />
          </div>
          <div className="mt-4 flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonBlock
                key={item}
                className="h-[134px] min-w-[168px] flex-1 rounded-[16px]"
              />
            ))}
          </div>
          <div className="mt-4 grid max-w-lg grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex flex-col items-center gap-2">
                <SkeletonBlock className="h-11 w-11 rounded-full" />
                <SkeletonBlock className="h-3 w-12" />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1a2b] xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <div className="flex justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-28" />
              <SkeletonBlock className="h-3 w-44" />
            </div>
            <SkeletonBlock className="h-8 w-16" />
          </div>
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <SkeletonBlock key={item} className="h-16 w-full" />
            ))}
          </div>
        </section>
        <SkeletonBlock className="min-h-[360px] xl:col-start-1 xl:row-start-2" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}

export function WalletsSkeleton() {
  return (
    <div aria-label="Loading wallets">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <SkeletonBlock key={item} className="h-64 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div aria-label="Loading transactions">
      <HeaderSkeleton />
      <SkeletonBlock className="mb-5 h-24" />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0d1a2b]">
        <SkeletonBlock className="h-10 w-full" />
        <div className="mt-3 space-y-2">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <SkeletonBlock key={item} className="h-16 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div aria-label="Loading reports">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <SkeletonBlock key={item} className="h-28" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock key={item} className="h-[390px]" />
        ))}
      </div>
    </div>
  );
}

export function ListPageSkeleton({ rows = 6 }) {
  return (
    <div aria-label="Loading content">
      <HeaderSkeleton />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1a2b]">
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, item) => (
            <SkeletonBlock key={item} className="h-16 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function InlineLoadingBar({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block h-1.5 w-16 overflow-hidden rounded-full bg-current/20 ${className}`}
    >
      <span className="loading-bar absolute inset-y-0 left-0 w-1/2 rounded-full bg-current" />
    </span>
  );
}

function HeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-9 w-56" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>
      <ButtonSkeleton className="w-36" />
    </div>
  );
}
