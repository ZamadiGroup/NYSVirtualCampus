import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type UploadItem = {
  id: string;
  type: "assignment" | "submission" | "grade" | "note";
  ownerRole: "tutor" | "student";
  ownerName: string;
  description: string;
  createdAt: string;
};

type Props = {
  items: UploadItem[];
};

export default function AdminUploads({ items }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Admin: Uploaded Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {it.description}
                <Badge variant="secondary">{it.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p>By: {it.ownerName} ({it.ownerRole})</p>
                <p>Created: {new Date(it.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


