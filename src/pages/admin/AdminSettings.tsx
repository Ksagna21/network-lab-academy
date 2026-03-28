import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: "NetAcademy",
    emailNotifications: true,
    autoConfirm: false,
    maintenanceMode: false,
  });

  return (
    <AdminLayout title="Paramètres">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Général</CardTitle>
            <CardDescription>Paramètres généraux de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom du site</label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configurez les notifications de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notifications par email</p>
                <p className="text-xs text-muted-foreground">Envoyer des emails aux utilisateurs</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>Options de sécurité avancées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mode maintenance</p>
                <p className="text-xs text-muted-foreground">Désactiver l'accès public temporairement</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full">Sauvegarder les paramètres</Button>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
