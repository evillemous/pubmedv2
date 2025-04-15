import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ApiKey {
  key: string;
  value: string;
}

interface TestStatus {
  openai: { status: 'idle' | 'loading' | 'success' | 'error'; message: string };
  entrez: { status: 'idle' | 'loading' | 'success' | 'error'; message: string };
  nsqip: { status: 'idle' | 'loading' | 'success' | 'error'; message: string };
  seer: { status: 'idle' | 'loading' | 'success' | 'error'; message: string };
}

const AdminPage: React.FC = () => {
  const [formData, setFormData] = useState({
    openai_api_key: '',
    entrez_api_key: '',
    nsqip_api_key: '',
    seer_api_key: '',
  });
  const [testStatus, setTestStatus] = useState<TestStatus>({
    openai: { status: 'idle', message: '' },
    entrez: { status: 'idle', message: '' },
    nsqip: { status: 'idle', message: '' },
    seer: { status: 'idle', message: '' },
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'none'; message: string }>({
    type: 'none',
    message: '',
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/settings`);
      const data = await response.json();
      
      const newFormData = { ...formData };
      data.forEach((item: ApiKey) => {
        if (Object.keys(formData).includes(item.key)) {
          newFormData[item.key as keyof typeof formData] = item.value;
        }
      });
      
      setFormData(newFormData);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load API keys. Please try again.',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const saveApiKey = async (key: string, value: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save API key');
      }
      
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  };

  const handleSaveAll = async () => {
    setAlert({ type: 'none', message: '' });
    
    const keys = Object.keys(formData) as Array<keyof typeof formData>;
    const results = await Promise.all(
      keys.map(key => saveApiKey(key, formData[key]))
    );
    
    if (results.every(result => result)) {
      setAlert({
        type: 'success',
        message: 'All API keys saved successfully!',
      });
      fetchApiKeys(); // Refresh the list
    } else {
      setAlert({
        type: 'error',
        message: 'Failed to save some API keys. Please try again.',
      });
    }
  };

  const testConnection = async (keyType: keyof TestStatus) => {
    setTestStatus(prev => ({
      ...prev,
      [keyType]: { status: 'loading', message: 'Testing connection...' },
    }));
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/settings/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: `${keyType}_api_key` }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestStatus(prev => ({
          ...prev,
          [keyType]: { status: 'success', message: data.message || 'Connection successful!' },
        }));
      } else {
        setTestStatus(prev => ({
          ...prev,
          [keyType]: { status: 'error', message: data.error || 'Connection failed' },
        }));
      }
    } catch (error) {
      setTestStatus(prev => ({
        ...prev,
        [keyType]: { status: 'error', message: 'Connection test failed' },
      }));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
      
      {alert.type !== 'none' && (
        <Alert className={`mb-6 ${alert.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          {alert.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle>
            {alert.type === 'success' ? 'Success' : 'Error'}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Configure API keys for external services used by the Medical Research Assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="openai">
            <TabsList className="mb-4">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="entrez">Entrez</TabsTrigger>
              <TabsTrigger value="nsqip">NSQIP</TabsTrigger>
              <TabsTrigger value="seer">SEER</TabsTrigger>
            </TabsList>
            
            <TabsContent value="openai">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                  <Input
                    id="openai_api_key"
                    name="openai_api_key"
                    type="password"
                    value={formData.openai_api_key}
                    onChange={handleInputChange}
                    placeholder="sk-..."
                    className="mt-1"
                  />
                </div>
                {testStatus.openai.status !== 'idle' && (
                  <div className={`text-sm mt-2 ${
                    testStatus.openai.status === 'success' ? 'text-green-600' : 
                    testStatus.openai.status === 'error' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {testStatus.openai.status === 'loading' && (
                      <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                    )}
                    {testStatus.openai.status === 'success' && (
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.openai.status === 'error' && (
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.openai.message}
                  </div>
                )}
                <Button 
                  onClick={() => testConnection('openai')}
                  disabled={testStatus.openai.status === 'loading' || !formData.openai_api_key}
                  variant="outline"
                >
                  Test Connection
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="entrez">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="entrez_api_key">Entrez API Key</Label>
                  <Input
                    id="entrez_api_key"
                    name="entrez_api_key"
                    type="password"
                    value={formData.entrez_api_key}
                    onChange={handleInputChange}
                    placeholder="Enter Entrez API Key"
                    className="mt-1"
                  />
                </div>
                {testStatus.entrez.status !== 'idle' && (
                  <div className={`text-sm mt-2 ${
                    testStatus.entrez.status === 'success' ? 'text-green-600' : 
                    testStatus.entrez.status === 'error' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {testStatus.entrez.status === 'loading' && (
                      <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                    )}
                    {testStatus.entrez.status === 'success' && (
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.entrez.status === 'error' && (
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.entrez.message}
                  </div>
                )}
                <Button 
                  onClick={() => testConnection('entrez')}
                  disabled={testStatus.entrez.status === 'loading' || !formData.entrez_api_key}
                  variant="outline"
                >
                  Test Connection
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="nsqip">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nsqip_api_key">NSQIP API Key</Label>
                  <Input
                    id="nsqip_api_key"
                    name="nsqip_api_key"
                    type="password"
                    value={formData.nsqip_api_key}
                    onChange={handleInputChange}
                    placeholder="Enter NSQIP API Key"
                    className="mt-1"
                  />
                </div>
                {testStatus.nsqip.status !== 'idle' && (
                  <div className={`text-sm mt-2 ${
                    testStatus.nsqip.status === 'success' ? 'text-green-600' : 
                    testStatus.nsqip.status === 'error' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {testStatus.nsqip.status === 'loading' && (
                      <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                    )}
                    {testStatus.nsqip.status === 'success' && (
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.nsqip.status === 'error' && (
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.nsqip.message}
                  </div>
                )}
                <Button 
                  onClick={() => testConnection('nsqip')}
                  disabled={testStatus.nsqip.status === 'loading' || !formData.nsqip_api_key}
                  variant="outline"
                >
                  Test Connection
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="seer">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seer_api_key">SEER API Key</Label>
                  <Input
                    id="seer_api_key"
                    name="seer_api_key"
                    type="password"
                    value={formData.seer_api_key}
                    onChange={handleInputChange}
                    placeholder="Enter SEER API Key"
                    className="mt-1"
                  />
                </div>
                {testStatus.seer.status !== 'idle' && (
                  <div className={`text-sm mt-2 ${
                    testStatus.seer.status === 'success' ? 'text-green-600' : 
                    testStatus.seer.status === 'error' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {testStatus.seer.status === 'loading' && (
                      <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                    )}
                    {testStatus.seer.status === 'success' && (
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.seer.status === 'error' && (
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testStatus.seer.message}
                  </div>
                )}
                <Button 
                  onClick={() => testConnection('seer')}
                  disabled={testStatus.seer.status === 'loading' || !formData.seer_api_key}
                  variant="outline"
                >
                  Test Connection
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveAll}>Save All API Keys</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminPage;
