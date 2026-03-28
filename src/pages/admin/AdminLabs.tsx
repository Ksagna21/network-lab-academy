import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Terminal, Wifi, Phone } from "lucide-react";

const labScenarios = [
  { id: 1, title: "Configuration IP Addressing", category: "networking", difficulty: "Débutant", icon: Wifi, status: "published" },
  { id: 2, title: "Setup OSPF entre routeurs", category: "networking", difficulty: "Intermédiaire", icon: Wifi, status: "published" },
  { id: 3, title: "Permissions Linux", category: "linux", difficulty: "Débutant", icon: Terminal, status: "draft" },
  { id: 4, title: "Troubleshoot SIP Registration", category: "telecom", difficulty: "Avancé", icon: Phone, status: "published" },
  { id: 5, title: "Diagnostic réseau", category: "networking", difficulty: "Intermédiaire", icon: Wifi, status: "draft" },
];

const AdminLabs = () => {
  return (
    <AdminLayout title="Gestion des Labs">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Gérez vos environnements de lab interactifs</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau lab
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labScenarios.map((lab) => (
            <Card key={lab.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <lab.icon className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className={lab.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                    {lab.status === "published" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-3">{lab.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{lab.difficulty}</Badge>
                  <span className="text-xs text-muted-foreground capitalize">{lab.category}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">Modifier</Button>
                  <Button variant="outline" size="sm" className="flex-1">Tester</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLabs;
