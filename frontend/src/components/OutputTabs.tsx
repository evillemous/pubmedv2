import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { FileJson, BarChart2, FileText, FileOutput, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface OutputTabsProps {
  projectId?: string;
  rawData?: any;
  statsData?: any;
  manuscript?: string;
  journal?: string;
  onManuscriptChange?: (manuscript: string) => void;
}

const OutputTabs: React.FC<OutputTabsProps> = ({
  projectId,
  rawData = null,
  statsData = null,
  manuscript = '',
  journal = '',
  onManuscriptChange,
}) => {
  const [editableManuscript, setEditableManuscript] = useState(manuscript);
  const [formattedManuscript, setFormattedManuscript] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  
  useEffect(() => {
    setEditableManuscript(manuscript);
  }, [manuscript]);
  
  const handleManuscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableManuscript(e.target.value);
    if (onManuscriptChange) {
      onManuscriptChange(e.target.value);
    }
  };
  
  const formatManuscript = async () => {
    if (!editableManuscript || !journal) return;
    
    setIsFormatting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/manuscript/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manuscript: editableManuscript,
          journal,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to format manuscript');
      }
      
      const data = await response.json();
      setFormattedManuscript(data.formatted_manuscript);
    } catch (error) {
      console.error('Error formatting manuscript:', error);
    } finally {
      setIsFormatting(false);
    }
  };
  
  const downloadFormattedManuscript = () => {
    if (!formattedManuscript) return;
    
    const blob = new Blob([formattedManuscript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manuscript_${journal.toLowerCase()}_format.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Research Output</CardTitle>
        <CardDescription>
          View and edit your research data and manuscript
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manuscript">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="raw-data">
              <FileJson className="h-4 w-4 mr-2" />
              Raw Data
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart2 className="h-4 w-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="manuscript">
              <FileText className="h-4 w-4 mr-2" />
              Manuscript
            </TabsTrigger>
            <TabsTrigger value="formatted">
              <FileOutput className="h-4 w-4 mr-2" />
              Formatted
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="raw-data" className="min-h-80">
            {rawData ? (
              <div className="border rounded-md p-4 bg-gray-50 h-80 overflow-y-auto">
                <pre className="text-sm">{JSON.stringify(rawData, null, 2)}</pre>
              </div>
            ) : (
              <div className="border rounded-md p-4 bg-gray-50 h-80 flex items-center justify-center">
                <p className="text-gray-500 italic">
                  No raw data available. Submit a research query to get started.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stats" className="min-h-80">
            {statsData ? (
              <div className="border rounded-md p-4 bg-white h-80 overflow-y-auto">
                {statsData.forest_plot && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Forest Plot</h3>
                    <img 
                      src={`data:image/png;base64,${statsData.forest_plot}`} 
                      alt="Forest Plot" 
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
                
                {statsData.funnel_plot && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Funnel Plot</h3>
                    <img 
                      src={`data:image/png;base64,${statsData.funnel_plot}`} 
                      alt="Funnel Plot" 
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
                
                {statsData.heterogeneity && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Heterogeneity</h3>
                    <ul className="list-disc pl-5">
                      <li>I² = {statsData.heterogeneity.i_squared.toFixed(2)}%</li>
                      <li>Q = {statsData.heterogeneity.q_statistic.toFixed(2)}</li>
                      <li>p-value = {statsData.heterogeneity.p_value.toFixed(4)}</li>
                    </ul>
                  </div>
                )}
                
                {statsData.summary && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Summary Effect</h3>
                    <ul className="list-disc pl-5">
                      <li>Effect Size = {statsData.summary.effect_size.toFixed(2)}</li>
                      <li>95% CI = [{statsData.summary.ci_low.toFixed(2)}, {statsData.summary.ci_high.toFixed(2)}]</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-md p-4 bg-gray-50 h-80 flex items-center justify-center">
                <p className="text-gray-500 italic">
                  No statistical data available. Submit a research query to get started.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manuscript" className="min-h-80">
            <div className="border rounded-md p-4 bg-white h-80">
              <Textarea
                value={editableManuscript}
                onChange={handleManuscriptChange}
                placeholder="Your manuscript will appear here. You can edit it directly."
                className="h-full resize-none"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="formatted" className="min-h-80">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button 
                  onClick={formatManuscript} 
                  disabled={!editableManuscript || !journal || isFormatting}
                >
                  {isFormatting ? 'Formatting...' : 'Format for Journal'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={downloadFormattedManuscript}
                  disabled={!formattedManuscript}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="border rounded-md p-4 bg-white h-80 overflow-y-auto">
                {formattedManuscript ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formattedManuscript}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic">
                    Click "Format for Journal" to see your manuscript formatted according to journal guidelines.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OutputTabs;
