import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserCheck, UserX, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: enrollments } = await supabase.from("enrollments").select("*");

      return profiles.map((p) => ({
        ...p,
        roles: roles?.filter((r) => r.user_id === p.user_id).map((r) => r.role) || [],
        enrollmentCount: enrollments?.filter((e) => e.user_id === p.user_id).length || 0,
      }));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    admin: "bg-destructive/10 text-destructive",
    instructor: "bg-accent/10 text-accent-foreground",
    student: "bg-primary/10 text-primary",
  };

  return (
    <AdminLayout title="Gestion des utilisateurs">
      <div className="space-y-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Cours inscrits</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</TableCell>
                  </TableRow>
                ) : filtered.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium">{user.full_name || "Sans nom"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.map((role: string) => (
                          <Badge key={role} variant="secondary" className={roleColors[role] || ""}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{user.total_xp}</TableCell>
                    <TableCell>{user.level}</TableCell>
                    <TableCell>{user.enrollmentCount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={user.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                        {user.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActiveMutation.mutate({ userId: user.user_id, isActive: !user.is_active });
                        }}
                      >
                        {user.is_active ? <UserX className="w-4 h-4 text-destructive" /> : <UserCheck className="w-4 h-4 text-primary" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profil de {selectedUser?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {selectedUser.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUser.full_name}</h3>
                    <p className="text-sm text-muted-foreground">Niveau {selectedUser.level} • {selectedUser.total_xp} XP</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Streak</p>
                    <p className="text-lg font-bold">{selectedUser.current_streak} jours</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Cours</p>
                    <p className="text-lg font-bold">{selectedUser.enrollmentCount}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Rôles</p>
                  <div className="flex gap-2">
                    {selectedUser.roles.map((role: string) => (
                      <Badge key={role} className={roleColors[role]}>{role}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
