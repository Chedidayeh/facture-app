import { DataTable } from "./_components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getClients } from "./actions";

export default async function Page() {
  const data = await getClients();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/dashboard/clients/create">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">Créer client</span>
          </Button>
        </Link>
      </div>{" "}
      <DataTable data={data} />
    </div>
  );
}
