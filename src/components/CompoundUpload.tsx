import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompoundUploadProps {
  onCompoundCreated: (compoundId: string) => void;
}

export const CompoundUpload = ({ onCompoundCreated }: CompoundUploadProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [smiles, setSmiles] = useState("");
  const [literatureText, setLiteratureText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !smiles.trim()) {
      toast.error("Please provide compound name and SMILES");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create compound
      const { data: compound, error: compoundError } = await supabase
        .from("compounds")
        .insert({
          user_id: user.id,
          name: name.trim(),
          smiles: smiles.trim(),
          status: "pending",
        })
        .select()
        .single();

      if (compoundError) throw compoundError;

      // If literature provided, add it
      if (literatureText.trim()) {
        await supabase.from("literature_references").insert({
          compound_id: compound.id,
          user_id: user.id,
          title: `Literature for ${name}`,
          content: literatureText.trim(),
        });
      }

      // Create audit log
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "compound_created",
        details: { compound_id: compound.id, name },
      });

      toast.success("Compound uploaded successfully!");
      onCompoundCreated(compound.id);
      
      // Reset form
      setName("");
      setSmiles("");
      setLiteratureText("");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload compound");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Compound
        </CardTitle>
        <CardDescription>
          Enter compound details and optional literature context
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compound-name">Compound Name *</Label>
            <Input
              id="compound-name"
              placeholder="e.g., Aspirin Derivative 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smiles">SMILES Notation *</Label>
            <Input
              id="smiles"
              placeholder="e.g., CC(=O)Oc1ccccc1C(=O)O"
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Simplified Molecular Input Line Entry System
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="literature">Literature Context (Optional)</Label>
            <Textarea
              id="literature"
              placeholder="Add relevant literature, research context, or known properties..."
              value={literatureText}
              onChange={(e) => setLiteratureText(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Compound
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};