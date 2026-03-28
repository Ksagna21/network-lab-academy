import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(175, 84%, 32%)", "hsl(38, 92%, 50%)", "hsl(210, 18%, 93%)", "hsl(0, 72%, 51%)"];

const AdminAnalytics = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [profiles, courses, enrollments] = await Promise.all([
        supabase.from("profiles").select("created_at, level, total_xp"),
        supabase.from("courses").select("category, status"),
        supabase.from("enrollments").select("completed, course_id"),
      ]);

      const categoryData = ["networking", "linux", "telecom"].map((cat) => ({
        name: cat === "networking" ? "Réseaux" : cat === "linux" ? "Linux" : "Télécom",
        value: courses.data?.filter((c) => c.category === cat).length || 0,
      }));

      const levelData = [1, 2, 3, 4, 5].map((level) => ({
        name: `Niv. ${level}`,
        users: profiles.data?.filter((p) => p.level === level).length || 0,
      }));

      const completionRate = enrollments.data?.length
        ? Math.round((enrollments.data.filter((e) => e.completed).length / enrollments.data.length) * 100)
        : 0;

      return {
        totalUsers: profiles.data?.length || 0,
        totalCourses: courses.data?.length || 0,
        totalEnrollments: enrollments.data?.length || 0,
        completionRate,
        categoryData,
        levelData,
        publishedCourses: courses.data?.filter((c) => c.status === "published").length || 0,
        draftCourses: courses.data?.filter((c) => c.status === "draft").length || 0,
      };
    },
  });

  return (
    <AdminLayout title="Analytiques">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total utilisateurs", value: stats?.totalUsers || 0 },
            { label: "Cours publiés", value: stats?.publishedCourses || 0 },
            { label: "Inscriptions", value: stats?.totalEnrollments || 0 },
            { label: "Taux complétion", value: `${stats?.completionRate || 0}%` },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilisateurs par niveau</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.levelData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cours par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {(stats?.categoryData || []).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
