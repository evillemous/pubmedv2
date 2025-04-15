import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mic, Send, Loader2, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatAssistantProps {
  projectId?: string;
  initialManuscript?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ projectId, initialManuscript = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your medical research assistant. How can I help with your manuscript?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [manuscript, setManuscript] = useState(initialManuscript);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/manuscript/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: userMessage.content,
          current_manuscript: manuscript,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update manuscript');
      }
      
      const data = await response.json();
      
      setManuscript(data.manuscript);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'I\'ve updated the manuscript based on your request.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error updating manuscript:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while updating the manuscript. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        console.log('Microphone permission state:', permissionStatus.state);
        
        if (permissionStatus.state === 'granted') {
          return true;
        }
        
        if (permissionStatus.state === 'denied') {
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Microphone access is blocked. Please enable microphone permissions in your browser settings and try again.',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, errorMessage]);
          return false;
        }
        
        permissionStatus.addEventListener('change', () => {
          console.log('Microphone permission state changed to:', permissionStatus.state);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        setRecordingStatus('idle');
        return;
      }
      
      setRecordingStatus('listening');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        setRecordingStatus('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (base64Audio) {
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
              const response = await fetch(`${apiUrl}/api/manuscript/transcribe`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  audio_base64: base64Audio,
                }),
              });
              
              if (!response.ok) {
                throw new Error('Failed to transcribe audio');
              }
              
              const data = await response.json();
              
              setInputMessage(data.transcription);
              
              const userMessage: ChatMessage = {
                role: 'user',
                content: data.transcription,
                timestamp: new Date(),
              };
              
              setMessages(prev => [...prev, userMessage]);
              
              await processVoiceCommand(data.transcription);
            } catch (error) {
              console.error('Error transcribing audio:', error);
              
              const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error while transcribing your voice. Please try again.',
                timestamp: new Date(),
              };
              
              setMessages(prev => [...prev, errorMessage]);
            }
          }
          
          setRecordingStatus('idle');
        };
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingStatus('idle');
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t access your microphone. Please check your browser permissions and try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/manuscript/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          current_manuscript: manuscript,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update manuscript');
      }
      
      const data = await response.json();
      
      setManuscript(data.manuscript);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'I\'ve updated the manuscript based on your voice command.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing voice command:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your voice command. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Live Chat Assistant</CardTitle>
        <CardDescription>
          Interact with the research assistant using text or voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="chat">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="manuscript">Manuscript</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4">
            <div className="h-80 overflow-y-auto border rounded-md p-4 bg-gray-50">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${
                    message.role === 'user' 
                      ? 'text-right' 
                      : 'text-left'
                  }`}
                >
                  <div 
                    className={`inline-block max-w-3/4 p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="flex items-center space-x-2">
              <Textarea
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isProcessing}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className="flex-shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              
              {isRecording ? (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-shrink-0"
                  disabled={recordingStatus === 'processing'}
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  variant="outline"
                  className="flex-shrink-0"
                  disabled={isProcessing || recordingStatus !== 'idle'}
                >
                  {recordingStatus === 'processing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            
            {recordingStatus === 'listening' && (
              <div className="text-center text-sm text-red-500 animate-pulse">
                Recording... Click stop when finished.
              </div>
            )}
            
            {recordingStatus === 'processing' && (
              <div className="text-center text-sm text-blue-500">
                Processing your voice command...
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manuscript">
            <div className="border rounded-md p-4 bg-white h-96 overflow-y-auto">
              {manuscript ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {manuscript}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">
                  No manuscript content yet. Start a conversation to generate content.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        You can use voice commands like "Expand the discussion on elderly patients"
      </CardFooter>
    </Card>
  );
};

export default ChatAssistant;
