import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Compound {
  id: string;
  name: string;
  smiles: string;
  status: string;
  created_at: string;
  molecular_weight?: number;
  formula?: string;
}

interface CompoundListProps {
  refreshTrigger?: number;
  onAnalyze: (compoundId: string) => void;
}

export const CompoundList = ({ refreshTrigger, onAnalyze }: CompoundListProps) => {
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompounds();
  }, [refreshTrigger]);

  const fetchCompounds = async () => {
    try {
      const { data, error } = await supabase
        .from("compounds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setCompounds(data || []);
    } catch (error: any) {
      toast.error("Failed to load compounds");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "analyzing":
        return "bg-warning text-warning-foreground";
      case "pending":
        return "bg-muted text-muted-foreground";
      case "failed":
      case "timeout":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (compounds.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No compounds yet. Upload one to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {compounds.map((compound) => (
        <Card key={compound.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{compound.name}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">{compound.smiles}</p>
              </div>
              <Badge className={getStatusColor(compound.status)}>
                {compound.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Created: {new Date(compound.created_at).toLocaleDateString()}</p>
                {compound.molecular_weight && (
                  <p>MW: {compound.molecular_weight.toFixed(2)} g/mol</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => onAnalyze(compound.id)}
                disabled={compound.status === "analyzing"}
              >
                <Play className="mr-2 h-4 w-4" />
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};