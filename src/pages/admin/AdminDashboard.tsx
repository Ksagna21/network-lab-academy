import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Award, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, courses, enrollments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalUsers: profiles.count || 0,
        totalCourses: courses.count || 0,
        totalEnrollments: enrollments.count || 0,
      };
    },
  });

  const statCards = [
    { title: "Utilisateurs", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
    { title: "Cours", value: stats?.totalCourses || 0, icon: BookOpen, color: "text-accent" },
    { title: "Inscriptions", value: stats?.totalEnrollments || 0, icon: Award, color: "text-primary" },
    { title: "Taux de complétion", value: "72%", icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <AdminLayout title="Tableau de bord">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">
            Bienvenue, {profile?.full_name?.split(" ")[0] || "Admin"} 👋
          </h2>
          <p className="text-muted-foreground">Voici un aperçu de votre plateforme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { text: "Nouveau cours publié : Linux Avancé", time: "Il y a 2h" },
                  { text: "15 nouveaux étudiants inscrits", time: "Il y a 5h" },
                  { text: "Quiz OSPF mis à jour", time: "Hier" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm">{item.text}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cours populaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Fondamentaux Linux", students: 342 },
                  { name: "Networking Basics", students: 289 },
                  { name: "VoIP & SIP", students: 156 },
                ].map((course, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-medium">{course.name}</span>
                    <span className="text-xs text-muted-foreground">{course.students} étudiants</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
