import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const researchTypeOptions = [
  { value: 'Systematic Review', label: 'Systematic Review' },
  { value: 'Meta-analysis', label: 'Meta-analysis' },
  { value: 'Narrative Review', label: 'Narrative Review' },
  { value: 'Scoping Review', label: 'Scoping Review' },
];

const journalOptions = [
  { value: 'JAMA', label: 'JAMA' },
  { value: 'Laryngoscope', label: 'Laryngoscope' },
  { value: 'NEJM', label: 'NEJM' },
  { value: 'BMJ', label: 'BMJ' },
  { value: 'The Lancet', label: 'The Lancet' },
  { value: 'Annals of Internal Medicine', label: 'Annals of Internal Medicine' },
];

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }),
  type: z.string({ required_error: 'Please select a research type' }),
  population: z.string().min(3, { message: 'Population must be at least 3 characters' }),
  outcomes: z.string().min(3, { message: 'Outcomes must be at least 3 characters' }),
  journal: z.string({ required_error: 'Please select a target journal' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ResearchFormProps {
  onSubmit: (data: FormValues) => void;
}

const ResearchForm: React.FC<ResearchFormProps> = ({ onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      type: '',
      population: '',
      outcomes: '',
      journal: '',
    },
  });

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Research Input Form</CardTitle>
        <CardDescription>
          Enter your research details to generate a manuscript
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter research title" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide a clear, concise title for your research
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select research type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {researchTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of research you are conducting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="population"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Population</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the study population" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the population being studied (e.g., "Adults with laryngeal cancer")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="outcomes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome Measures</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the outcome measures" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the primary and secondary outcomes (e.g., "5-year survival rate")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="journal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Journal</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target journal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {journalOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the journal you are targeting for publication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Research'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResearchForm;
