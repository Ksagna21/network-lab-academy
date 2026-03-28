import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CourseStatus = Database["public"]["Enums"]["course_status"];

const AdminCourses = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "networking", level: "débutant", is_free: false, xp_reward: 100 });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (courseData: typeof form) => {
      const { error } = await supabase.from("courses").insert({
        ...courseData,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Cours créé avec succès !" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from("courses").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      toast({ title: "Cours mis à jour !" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Cours supprimé" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CourseStatus }) => {
      const { error } = await supabase.from("courses").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const resetForm = () => setForm({ title: "", description: "", category: "networking", level: "débutant", is_free: false, xp_reward: 100 });

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setForm({ title: course.title, description: course.description || "", category: course.category, level: course.level, is_free: course.is_free, xp_reward: course.xp_reward });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-primary/10 text-primary",
    archived: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    published: "Publié",
    archived: "Archivé",
  };

  return (
    <AdminLayout title="Gestion des cours">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un cours..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingCourse(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau cours
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Modifier le cours" : "Créer un cours"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Titre du cours" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="networking">Réseaux</SelectItem>
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="telecom">Télécom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="débutant">Débutant</SelectItem>
                      <SelectItem value="intermédiaire">Intermédiaire</SelectItem>
                      <SelectItem value="avancé">Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="rounded" />
                    Gratuit
                  </label>
                  <Input type="number" placeholder="XP" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })} className="w-24" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCourse ? "Mettre à jour" : "Créer le cours"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun cours trouvé</TableCell>
                  </TableRow>
                ) : filtered.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell className="capitalize">{course.category}</TableCell>
                    <TableCell>{course.level}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[course.status]} variant="secondary">
                        {statusLabels[course.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{course.xp_reward}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {course.status === "draft" && (
                          <Button variant="ghost" size="icon" onClick={() => publishMutation.mutate({ id: course.id, status: "published" })} title="Publier">
                            <Eye className="w-4 h-4 text-primary" />
                          </Button>
                        )}
                        {course.status === "published" && (
                          <Button variant="ghost" size="icon" onClick={() => publishMutation.mutate({ id: course.id, status: "archived" })} title="Archiver">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(course.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
