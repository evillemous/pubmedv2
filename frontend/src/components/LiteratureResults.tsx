import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { Database, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  abstract: string;
}

interface NSQIPDataset {
  id: string;
  title: string;
  dataset: string;
  patientCount: number;
  variables: string[];
  summary: string;
}

interface SEERDataset {
  id: string;
  title: string;
  dataset: string;
  patientCount: number;
  variables: string[];
  summary: string;
}

interface LiteratureData {
  articles?: Article[];
  results?: Article[]; // Keep for backward compatibility
  nsqip?: {
    results: NSQIPDataset[];
  };
  seer?: {
    results: SEERDataset[];
  };
}

interface LiteratureResultsProps {
  data: LiteratureData | null;
  isLoading?: boolean;
}

const LiteratureResults: React.FC<LiteratureResultsProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Literature Search Results</CardTitle>
          <CardDescription>Searching for relevant literature...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mr-2"></div>
          <p>Loading results...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Literature Search Results</CardTitle>
          <CardDescription>Submit a research query to see results</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No search results yet. Fill out the research form to search for relevant literature.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pubmedResults = data.articles || data.results || [];
  const nsqipResults = data.nsqip?.results || [];
  const seerResults = data.seer?.results || [];

  const hasResults = pubmedResults.length > 0 || nsqipResults.length > 0 || seerResults.length > 0;

  if (!hasResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Literature Search Results</CardTitle>
          <CardDescription>No results found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No results found for your search criteria. Try modifying your search terms.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Literature Search Results</CardTitle>
        <CardDescription>
          Found {pubmedResults.length} PubMed articles
          {nsqipResults.length > 0 && `, ${nsqipResults.length} NSQIP datasets`}
          {seerResults.length > 0 && `, ${seerResults.length} SEER datasets`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pubmed">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="pubmed" disabled={pubmedResults.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              PubMed Articles
            </TabsTrigger>
            <TabsTrigger value="nsqip" disabled={nsqipResults.length === 0}>
              <Database className="h-4 w-4 mr-2" />
              NSQIP Datasets
            </TabsTrigger>
            <TabsTrigger value="seer" disabled={seerResults.length === 0}>
              <Database className="h-4 w-4 mr-2" />
              SEER Datasets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pubmed">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {pubmedResults.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="nsqip">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {nsqipResults.map((dataset) => (
                  <DatasetCard key={dataset.id} dataset={dataset} type="NSQIP" />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="seer">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {seerResults.map((dataset) => (
                  <DatasetCard key={dataset.id} dataset={dataset} type="SEER" />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Results can be used for meta-analysis and manuscript generation.
        </p>
      </CardFooter>
    </Card>
  );
};

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">{article.title}</CardTitle>
          <CollapsibleTrigger
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </CollapsibleTrigger>
        </div>
        <CardDescription className="text-xs">
          {article.authors.slice(0, 3).join(', ')}
          {article.authors.length > 3 && ' et al.'} | {article.journal} | {article.pubDate}
        </CardDescription>
      </CardHeader>
      <Collapsible open={isOpen}>
        <CollapsibleContent>
          <CardContent className="py-2">
            <p className="text-sm">{article.abstract}</p>
          </CardContent>
          <CardFooter className="py-2 flex justify-between">
            <div>
              <Badge variant="outline" className="mr-1">
                PubMed ID: {article.id}
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              View on PubMed
            </Button>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

interface DatasetCardProps {
  dataset: NSQIPDataset | SEERDataset;
  type: 'NSQIP' | 'SEER';
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, type }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">{dataset.title}</CardTitle>
          <CollapsibleTrigger
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </CollapsibleTrigger>
        </div>
        <CardDescription className="text-xs">
          {dataset.dataset} | {dataset.patientCount.toLocaleString()} patients
        </CardDescription>
      </CardHeader>
      <Collapsible open={isOpen}>
        <CollapsibleContent>
          <CardContent className="py-2">
            <p className="text-sm mb-2">{dataset.summary}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {dataset.variables.map((variable) => (
                <Badge key={variable} variant="secondary" className="text-xs">
                  {variable}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="py-2 flex justify-between">
            <Badge variant="outline">{type} ID: {dataset.id}</Badge>
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default LiteratureResults;
