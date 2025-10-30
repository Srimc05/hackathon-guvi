import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, Zap } from "lucide-react";

interface PredictionResult {
  property: string;
  value: number;
  unit: string;
  confidence: number;
  interpretation: string;
}

interface ExperimentResultsProps {
  compoundName: string;
  results?: {
    predictions: PredictionResult[];
    aiExplanation?: string;
    runtime?: number;
    modelVersion?: string;
  };
  loading?: boolean;
}

export const ExperimentResults = ({ compoundName, results, loading }: ExperimentResultsProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyzing {compoundName}</CardTitle>
          <CardDescription>Running AI-powered predictions...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>Processing...</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground">
            This may take up to 2 minutes. Please wait...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>{compoundName}</CardDescription>
            </div>
            {results.runtime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {results.runtime.toFixed(1)}s
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.predictions && results.predictions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Predicted Properties
              </h3>
              <div className="grid gap-3">
                {results.predictions.map((pred, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pred.property}</span>
                      <span className="text-sm font-semibold">
                        {pred.value.toFixed(2)} {pred.unit}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence</span>
                        <span>{(pred.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={pred.confidence * 100} className="h-1" />
                    </div>
                    {pred.interpretation && (
                      <p className="text-xs text-muted-foreground">{pred.interpretation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.aiExplanation && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Analysis
              </h3>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {results.aiExplanation}
                </p>
              </div>
            </div>
          )}

          {results.modelVersion && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Model Version: {results.modelVersion}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};