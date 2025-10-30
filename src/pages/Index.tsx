import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { CompoundUpload } from "@/components/CompoundUpload";
import { CompoundList } from "@/components/CompoundList";
import { ExperimentResults } from "@/components/ExperimentResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCompoundId, setSelectedCompoundId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserEmail(session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUserEmail(session.user.email || "");
      }
    } catch (error) {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleCompoundCreated = (compoundId: string) => {
    setRefreshTrigger(prev => prev + 1);
    setSelectedCompoundId(compoundId);
  };

  const handleAnalyze = async (compoundId: string) => {
    setSelectedCompoundId(compoundId);
    setAnalyzing(true);
    setResults(null);

    try {
      // Get compound details
      const { data: compound } = await supabase
        .from("compounds")
        .select("*")
        .eq("id", compoundId)
        .single();

      if (!compound) throw new Error("Compound not found");

      // Update compound status
      await supabase
        .from("compounds")
        .update({ status: "analyzing" })
        .eq("id", compoundId);

      // Call analysis edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "analyze-compound",
        {
          body: { 
            compoundId,
            smiles: compound.smiles,
            name: compound.name
          }
        }
      );

      if (functionError) throw functionError;

      setResults(functionData);
      
      // Create experiment record
      await supabase.from("experiments").insert({
        compound_id: compoundId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        experiment_type: "admet",
        model_version: functionData.modelVersion || "v1.0",
        parameters: {},
        results: functionData,
        status: "completed",
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        runtime_seconds: functionData.runtime,
      });

      // Update compound status
      await supabase
        .from("compounds")
        .update({ status: "completed" })
        .eq("id", compoundId);

      // Create audit log
      await supabase.from("audit_logs").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: "experiment_completed",
        details: { compound_id: compoundId, type: "admet" },
      });

      toast.success("Analysis completed successfully!");
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
      
      // Update compound status to failed
      await supabase
        .from("compounds")
        .update({ status: "failed" })
        .eq("id", compoundId);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black text-white">
      <Header userEmail={userEmail} />
      
      <main className="container py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-100">GuviMed-Drug Discovery Platform</h2>
            <p className="text-muted-foreground mt-2 text-gray-400">
              Upload compounds, run AI-powered analysis, and accelerate your research
            </p>
          </div>

          <Tabs defaultValue="analyze" className="space-y-6">
            <TabsList>
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
              <TabsTrigger value="compounds">My Compounds</TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <CompoundUpload onCompoundCreated={handleCompoundCreated} />
                
                {(analyzing || results) && selectedCompoundId && (
                  <ExperimentResults
                    compoundName="Current Compound"
                    results={results}
                    loading={analyzing}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="compounds" className="space-y-6">
              <CompoundList 
                refreshTrigger={refreshTrigger} 
                onAnalyze={handleAnalyze}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
