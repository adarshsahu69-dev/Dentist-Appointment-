import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { ServiceActiveToggle } from "@/components/admin/service-active-toggle";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manage Services" };

export default async function AdminServicesPage() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") redirect("/unauthorized");

  const list = await data.listAllServices();

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="mt-1 text-muted-foreground">Create treatments, set durations and prices, and publish or unpublish them.</p>
        </div>
        <ServiceFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Add service
            </Button>
          }
        />
      </div>

      <div className="mt-8 space-y-4">
        {list.map((service) => (
          <Card key={service.id}>
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-base font-semibold">{service.name}</h2>
                  <Badge variant={service.is_active ? "success" : "muted"}>{service.is_active ? "Active" : "Inactive"}</Badge>
                  <Badge variant="secondary">{service.duration_minutes} min</Badge>
                  <Badge variant="outline">{service.price ? `$${service.price}` : "No fixed price"}</Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{service.description}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <ServiceFormDialog
                  service={{
                    id: service.id,
                    name: service.name,
                    description: service.description,
                    duration_minutes: service.duration_minutes,
                    price: service.price,
                    is_active: service.is_active,
                  }}
                  trigger={
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  }
                />
                <ServiceActiveToggle id={service.id} isActive={service.is_active} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
