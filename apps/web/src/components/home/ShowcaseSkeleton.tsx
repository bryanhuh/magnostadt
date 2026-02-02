
export function ShowcaseSkeleton() {
  return (
    <section className="relative w-full h-[90vh] min-h-[700px] bg-neutral-900 overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
      
      {/* Content Layout */}
      <div className="relative z-10 w-full h-full max-w-[1600px] mx-auto px-4 md:px-8 flex flex-col justify-center h-full">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20 h-full pt-20">
            
            {/* Left Column: Text Skeleton */}
            <div className="w-full md:w-[45%] space-y-8 flex flex-col justify-center">
                
                {/* Badge Skeleton */}
                <div className="flex items-center gap-3">
                     <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
                     <div className="h-[1px] w-12 bg-white/10" />
                     <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Title Skeleton (Massive) */}
                <div className="space-y-4">
                    <div className="h-20 md:h-24 w-3/4 bg-white/10 rounded-sm animate-pulse" />
                    <div className="h-20 md:h-24 w-1/2 bg-white/10 rounded-sm animate-pulse" />
                </div>
                
                {/* Description Skeleton */}
                <div className="space-y-2 max-w-xl pl-6 border-l-4 border-white/5">
                   <div className="h-5 w-full bg-white/10 rounded animate-pulse" />
                   <div className="h-5 w-5/6 bg-white/10 rounded animate-pulse" />
                   <div className="h-5 w-4/5 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Buttons Skeleton */}
                <div className="flex flex-wrap gap-4 pt-4">
                    <div className="h-16 w-48 bg-white/10 rounded-sm animate-pulse" />
                    <div className="h-16 w-40 bg-white/5 rounded-sm animate-pulse" />
                </div>
            </div>

            {/* Right Column: Visual Composition Skeleton */}
            <div className="relative w-full md:w-[55%] h-full flex items-center justify-center md:justify-end">
                 
                 {/* Floating Products Skeleton */}
                 <div className="absolute bottom-20 right-10 md:right-0 z-20 flex gap-4 md:gap-[calc(-3rem)]">
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            className={`
                                relative w-40 md:w-48 aspect-[3/4] 
                                bg-white/5 border border-white/5 rounded-xl 
                                ${i % 2 === 0 ? '-translate-y-10' : 'translate-y-0'}
                                animate-pulse
                            `}
                        />
                    ))}
                 </div>
            </div>

        </div>
      </div>
    </section>
  );
}
