import { Skeleton } from "@/components/ui/skeleton";

interface NewsSkeletonProps {
  count?: number;
}

/**
 * Skeleton loader for news articles
 */
export function NewsSkeleton({ count = 5 }: NewsSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="glass-panel p-4 animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex gap-4">
            {/* Image skeleton */}
            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            
            <div className="flex-1 space-y-3">
              {/* Title skeleton */}
              <Skeleton className="h-5 w-3/4" />
              
              {/* Description skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              {/* Meta skeleton */}
              <div className="flex items-center gap-3 pt-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Trending news skeleton
 */
export function TrendingNewsSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div 
          key={index}
          className="flex-shrink-0 w-[180px] glass-panel p-4 animate-pulse"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Skeleton className="w-10 h-10 rounded-full mb-3" />
          <Skeleton className="h-5 w-16 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * News card skeleton
 */
export function NewsCardSkeleton() {
  return (
    <div className="glass-panel p-4 animate-pulse">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsSkeleton;
