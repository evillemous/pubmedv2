import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, Settings } from 'lucide-react';
import ResearchForm from '../components/ResearchForm';
import ChatAssistant from '../components/ChatAssistant';
import OutputTabs from '../components/OutputTabs';
import LiteratureResults from '../components/LiteratureResults';

interface ResearchData {
  title: string;
  type: string;
  population: string;
  outcomes: string;
  journal: string;
}

interface LiteratureData {
  articles: any[];
  nsqip?: any;
  seer?: any;
}

interface StatsData {
  forest_plot?: string;
  funnel_plot?: string;
  heterogeneity?: {
    i_squared: number;
    q_statistic: number;
    p_value: number;
    df: number;
  };
  summary?: {
    effect_size: number;
    ci_low: number;
    ci_high: number;
    se: number;
  };
}

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'research' | 'assistant' | 'output'>('research');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [literatureData, setLiteratureData] = useState<LiteratureData | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [manuscript, setManuscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [apiKeysConfigured, setApiKeysConfigured] = useState<boolean>(false);
  
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/settings`);
        const data = await response.json();
        
        const hasOpenAiKey = data.some((item: any) => 
          item.key === 'openai_api_key' && item.value && item.value.length > 0
        );
        
        setApiKeysConfigured(hasOpenAiKey);
      } catch (error) {
        console.error('Error checking API keys:', error);
        setApiKeysConfigured(false);
      }
    };
    
    checkApiKeys();
  }, []);
  
  const handleResearchSubmit = async (data: ResearchData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const projectResponse = await fetch(`${apiUrl}/api/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!projectResponse.ok) {
        throw new Error('Failed to create research project');
      }
      
      const projectData = await projectResponse.json();
      setProjectId(projectData.id);
      setResearchData(data);
      
      const literatureResponse = await fetch(`${apiUrl}/api/literature/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          population: data.population,
          outcomes: data.outcomes,
        }),
      });
      
      if (!literatureResponse.ok) {
        throw new Error('Failed to search literature');
      }
      
      const literatureData = await literatureResponse.json();
      setLiteratureData(literatureData);
      setIsLoading(false); // Set loading to false after literature data is available
      
      try {
        const statsApiUrl = import.meta.env.VITE_STATS_API_URL || 'http://localhost:5000';
        const statsResponse = await fetch(`${statsApiUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studies: literatureData.articles.map((article: any) => ({
              title: article.title,
              n: article.n || 100, // Default sample size if not provided
              effect_size: article.effect_size || 1.0,
              ci_low: article.ci_low || 0.8,
              ci_high: article.ci_high || 1.2,
            })),
            analysis_type: 'random_effects',
          }),
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatsData(statsData);
        } else {
          console.warn('Statistics generation returned non-OK response:', statsResponse.status);
        }
      } catch (error) {
        console.error('Error generating statistics:', error);
      }
      
      try {
        const manuscriptResponse = await fetch(`${apiUrl}/api/manuscript/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            research_type: data.type,
            population: data.population,
            outcomes: data.outcomes,
            studies: literatureData.articles,
            journal: data.journal,
          }),
        });
        
        if (manuscriptResponse.ok) {
          const manuscriptData = await manuscriptResponse.json();
          setManuscript(manuscriptData.manuscript);
          
          try {
            await fetch(`${apiUrl}/api/research/${projectData.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                manuscript: manuscriptData.manuscript,
              }),
            });
          } catch (updateError) {
            console.error('Error updating research project with manuscript:', updateError);
          }
        } else {
          console.warn('Manuscript generation returned non-OK response:', manuscriptResponse.status);
        }
      } catch (error) {
        console.error('Error generating manuscript:', error);
      }
      
    } catch (error: any) {
      console.error('Error submitting research:', error);
      setError(error.message || 'An error occurred while processing your request');
      setIsLoading(false); // Ensure loading is set to false on error
    }
  };
  
  const handleManuscriptChange = async (updatedManuscript: string) => {
    setManuscript(updatedManuscript);
    
    if (projectId) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/api/research/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            manuscript: updatedManuscript,
          }),
        });
      } catch (error) {
        console.error('Error updating manuscript:', error);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Medical Research Assistant</h1>
        <p className="text-muted-foreground">
          AI-Powered Manuscript Generator for Medical Research
        </p>
      </div>
      
      {!apiKeysConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Keys Not Configured</AlertTitle>
          <AlertDescription>
            Please configure your API keys in the{' '}
            <Link to="/admin" className="font-medium underline">
              Admin
            </Link>{' '}
            section before using the application.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="research">Research Form</TabsTrigger>
            <TabsTrigger value="assistant">Chat Assistant</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Link to="/admin">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Admin Settings
          </Button>
        </Link>
      </div>
      
      <div className="min-h-96">
        {activeTab === 'research' && (
          <>
            {isLoading && (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mr-2"></div>
                <p>Processing your research request...</p>
              </div>
            )}
            
            {!literatureData && !isLoading ? (
              <ResearchForm onSubmit={handleResearchSubmit} />
            ) : (
              <div className="space-y-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setLiteratureData(null);
                    setProjectId(null);
                    setResearchData(null);
                    setStatsData(null);
                    setManuscript('');
                  }}
                >
                  Start New Research
                </Button>
                
                {literatureData && (
                  <LiteratureResults 
                    data={literatureData} 
                    isLoading={isLoading} 
                  />
                )}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'assistant' && (
          <ChatAssistant 
            projectId={projectId || undefined} 
            initialManuscript={manuscript}
          />
        )}
        
        {activeTab === 'output' && (
          <OutputTabs
            projectId={projectId || undefined}
            rawData={literatureData}
            statsData={statsData}
            manuscript={manuscript}
            journal={researchData?.journal}
            onManuscriptChange={handleManuscriptChange}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
