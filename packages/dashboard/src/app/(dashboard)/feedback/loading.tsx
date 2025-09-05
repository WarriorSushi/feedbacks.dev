export default function FeedbackLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-64" />
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:gap-4 lg:gap-6 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      
      {/* Feedback List */}
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}