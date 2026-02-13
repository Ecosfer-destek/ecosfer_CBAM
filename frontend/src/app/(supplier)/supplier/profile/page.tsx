"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Save } from "lucide-react";
import { toast } from "sonner";

export default function SupplierProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current user/supplier profile from session
    // In a real implementation, this would fetch the supplier profile
    // based on the logged-in user's supplierId from the session
    async function loadProfile() {
      try {
        const res = await fetch("/api/supplier/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setContactPerson(data.contactPerson || "");
          setTaxNumber(data.taxNumber || "");
          setTaxOffice(data.taxOffice || "");
        }
      } catch {
        // Profile API not yet implemented - show empty form
      }
    }
    loadProfile();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/supplier/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          contactPerson,
          taxNumber,
          taxOffice,
        }),
      });
      if (res.ok) {
        toast.success("Profil güncellendi");
      } else {
        toast.error("Profil güncellenirken bir hata oluştu");
      }
    } catch {
      toast.error("Profil güncellenirken bir hata oluştu");
    }
    setIsSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profilim</h1>
        <p className="text-muted-foreground">
          Tedarikçi bilgilerinizi görüntüleyin ve güncelleyin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tedarikçi Bilgileri
          </CardTitle>
          <CardDescription>
            CBAM beyannamelerinde kullanılacak tedarikçi bilgileriniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Şirket Adı</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tedarikçi şirket adı"
              />
            </div>
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="iletişim@firma.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 xxx xxx xx xx"
              />
            </div>
            <div className="space-y-2">
              <Label>Yetkili Kişi</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>
            <div className="space-y-2">
              <Label>Vergi Numarası</Label>
              <Input
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="Vergi numarası"
              />
            </div>
            <div className="space-y-2">
              <Label>Vergi Dairesi</Label>
              <Input
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
                placeholder="Vergi dairesi"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Adres</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Şirket adresi"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
