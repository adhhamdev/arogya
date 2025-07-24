import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DoctorPatientsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-4 rounded-md border p-4">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Skeleton className="h-5 w-32 mr-2" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-y-1 gap-x-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:ml-auto">
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-9 w-44" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
