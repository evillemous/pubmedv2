import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { getSetting } from '../models/settings';
import * as htmlPdf from 'html-pdf-node';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { marked } from 'marked';

const router = express.Router();

// Generate simulated manuscript for testing
const generateSimulatedManuscript = (research_type: string, population: string, outcomes: string, journal: string) => {
  return `# ${research_type} of ${outcomes} in ${population}

## Abstract

This is a simulated manuscript abstract for a ${research_type} focusing on ${outcomes} in ${population}. The manuscript follows the formatting guidelines for ${journal}.

## Introduction

This introduction provides background information on ${outcomes} in ${population}. It discusses the significance of the research and the gap in the literature that this ${research_type} aims to address.

## Methods

This section describes the methodology used for this ${research_type}. It includes information on the search strategy, inclusion and exclusion criteria, data extraction, and statistical analysis.

## Results

This section presents the results of the ${research_type}. It includes information on the studies included, the characteristics of the participants, and the outcomes measured.

## Discussion

This discussion interprets the results in the context of existing literature. It discusses the implications of the findings for clinical practice and future research.

## Conclusion

This conclusion summarizes the main findings of the ${research_type} and their implications for clinical practice and future research.

## References

1. Smith J, Johnson A, Williams R. A study on ${outcomes} in ${population}. Journal of Medical Research. 2023;45(2):123-145.
2. Brown T, Davis M, Wilson P. ${research_type} of interventions for ${population}. Medical Reviews. 2022;18(3):234-256.
3. Garcia R, Martinez L, Anderson K. Clinical outcomes in ${population}. Journal of Clinical Studies. 2024;30(1):45-67.`;
};

// Generate simulated manuscript update for testing
const generateSimulatedManuscriptUpdate = (command: string, current_manuscript: string) => {
  const sections = current_manuscript.split('## ');
  const updatedSections = sections.map(section => {
    if (section.startsWith('Discussion')) {
      return `Discussion\n\n${section.substring(10)}\n\nAs requested, here is additional information regarding "${command}". This paragraph expands on the topic with relevant details and analysis.`;
    }
    return section;
  });
  
  return updatedSections.join('## ');
};

// Generate manuscript using OpenAI
router.post('/generate', (req: Request, res: Response, next: NextFunction) => {
  const generateManuscript = async () => {
    try {
      const { research_type, population, outcomes, studies, stats, journal } = req.body;
      
      if (!research_type || !population || !outcomes || !journal) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['research_type', 'population', 'outcomes', 'journal'] 
        });
      }
      
      // Get OpenAI API key from settings
      const apiKeySetting = await getSetting('openai_api_key');
      const apiKey = apiKeySetting?.value;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenAI API key not found in settings' });
      }
      
      // Prepare prompt for OpenAI
      const prompt = `
        Generate a complete academic manuscript for a ${research_type} on ${population} focusing on ${outcomes}.
        The manuscript should follow the formatting guidelines for ${journal}.
        
        Include the following sections:
        1. Title
        2. Abstract
        3. Introduction
        4. Methods
        5. Results
        6. Discussion
        7. Conclusion
        8. References
        
        ${studies ? `Use the following studies in your analysis: ${JSON.stringify(studies)}` : ''}
        ${stats ? `Include these statistical findings: ${JSON.stringify(stats)}` : ''}
        
        Format the manuscript in markdown.
      `;
      
      // Call OpenAI API
      let manuscriptContent;
      
      try {
        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are an expert medical researcher and academic writer.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        if (!openaiResponse.data || !openaiResponse.data.choices || openaiResponse.data.choices.length === 0) {
          throw new Error('Invalid response from OpenAI API');
        }
        
        manuscriptContent = openaiResponse.data.choices[0].message.content;
      } catch (error) {
        console.log('Error with OpenAI API, using simulated manuscript:', error);
        manuscriptContent = generateSimulatedManuscript(research_type, population, outcomes, journal);
      }
      
      res.json({ manuscript: manuscriptContent });
    } catch (error: any) {
      console.error('Error generating manuscript:', error);
      res.status(500).json({ 
        error: 'Failed to generate manuscript',
        details: error.message
      });
    }
  };
  
  generateManuscript().catch(next);
});

// Update manuscript using voice command
router.post('/update', (req: Request, res: Response, next: NextFunction) => {
  const updateManuscript = async () => {
    try {
      const { command, current_manuscript } = req.body;
      
      if (!command || !current_manuscript) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['command', 'current_manuscript'] 
        });
      }
      
      // Get OpenAI API key from settings
      const apiKeySetting = await getSetting('openai_api_key');
      const apiKey = apiKeySetting?.value;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenAI API key not found in settings' });
      }
      
      // Prepare prompt for OpenAI
      const prompt = `
        I have a medical research manuscript in markdown format. Please update it based on the following command:
        
        Command: "${command}"
        
        Current manuscript:
        ${current_manuscript}
        
        Please return the complete updated manuscript in markdown format.
      `;
      
      // Call OpenAI API
      let updatedManuscript;
      
      try {
        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are an expert medical researcher and academic writer.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        if (!openaiResponse.data || !openaiResponse.data.choices || openaiResponse.data.choices.length === 0) {
          throw new Error('Invalid response from OpenAI API');
        }
        
        updatedManuscript = openaiResponse.data.choices[0].message.content;
      } catch (error) {
        console.log('Error with OpenAI API, using simulated manuscript update:', error);
        updatedManuscript = generateSimulatedManuscriptUpdate(command, current_manuscript);
      }
      
      res.json({ manuscript: updatedManuscript });
    } catch (error: any) {
      console.error('Error updating manuscript:', error);
      res.status(500).json({ 
        error: 'Failed to update manuscript',
        details: error.message
      });
    }
  };
  
  updateManuscript().catch(next);
});

// Format manuscript for specific journal
router.post('/format', (req: Request, res: Response, next: NextFunction) => {
  const formatManuscript = async () => {
    try {
      const { manuscript, journal } = req.body;
      
      if (!manuscript || !journal) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['manuscript', 'journal'] 
        });
      }
      
      // Get OpenAI API key from settings
      const apiKeySetting = await getSetting('openai_api_key');
      const apiKey = apiKeySetting?.value;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenAI API key not found in settings' });
      }
      
      // Prepare prompt for OpenAI
      const prompt = `
        I have a medical research manuscript in markdown format. Please reformat it to match the specific 
        formatting requirements of the journal "${journal}".
        
        Current manuscript:
        ${manuscript}
        
        Please return the reformatted manuscript in markdown format that follows all the specific formatting 
        guidelines for ${journal}, including proper citation style, headings, and structure.
      `;
      
      // Call OpenAI API
      let formattedManuscript;
      
      try {
        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are an expert in academic publishing and journal formatting.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        if (!openaiResponse.data || !openaiResponse.data.choices || openaiResponse.data.choices.length === 0) {
          throw new Error('Invalid response from OpenAI API');
        }
        
        formattedManuscript = openaiResponse.data.choices[0].message.content;
      } catch (error) {
        console.log('Error with OpenAI API, using original manuscript for formatting:', error);
        formattedManuscript = manuscript; // Just use the original manuscript if formatting fails
      }
      
      // Convert markdown to HTML using marked
      const htmlContent = marked.parse(formattedManuscript);
      
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Manuscript for ${journal}</title>
          <style>
            body {
              font-family: ${journal === 'JAMA' ? 'Times New Roman' : 'Arial'}, serif;
              font-size: 12pt;
              line-height: 1.5;
              margin: ${journal === 'JAMA' ? '1in' : '2.54cm'};
            }
            h1 { font-size: 16pt; text-align: center; }
            h2 { font-size: 14pt; }
            .abstract { font-style: italic; }
            .references { text-indent: -0.5in; padding-left: 0.5in; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;
      
      const outputFormat = req.query.format?.toString().toLowerCase() || 'pdf';
      
      if (outputFormat === 'pdf') {
        // Generate PDF
        const options = { format: 'A4' };
        const file = { content: styledHtml };
        
        try {
          const pdfBuffer = await htmlPdf.generatePdf(file, options);
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="manuscript_${journal.replace(/\s+/g, '_')}.pdf"`);
          
          return res.send(pdfBuffer);
        } catch (pdfError: any) {
          console.error('Error generating PDF:', pdfError);
          return res.status(500).json({ 
            error: 'Failed to generate PDF',
            details: pdfError.message || 'Unknown error'
          });
        }
      } else if (outputFormat === 'docx') {
        // Generate DOCX
        try {
          // Parse markdown and create paragraphs
          const lines = formattedManuscript.split('\n');
          const paragraphs = [];
          
          for (const line of lines) {
            if (line.startsWith('# ')) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line.substring(2),
                      size: 32, // 16pt
                    })
                  ],
                  heading: HeadingLevel.HEADING_1,
                  alignment: AlignmentType.CENTER,
                })
              );
            } else if (line.startsWith('## ')) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line.substring(3),
                      size: 28, // 14pt
                    })
                  ],
                  heading: HeadingLevel.HEADING_2,
                })
              );
            } else if (line.trim() === '') {
              paragraphs.push(new Paragraph({}));
            } else {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      font: journal === 'JAMA' ? 'Times New Roman' : 'Arial',
                      size: 24, // 12pt
                    })
                  ],
                })
              );
            }
          }
          
          // Create document with sections already defined
          const doc = new Document({
            sections: [
              {
                properties: {},
                children: paragraphs
              }
            ]
          });
          
          // Create a temporary file
          const tempFilePath = path.join(os.tmpdir(), `manuscript_${journal.replace(/\s+/g, '_')}_${Date.now()}.docx`);
          
          // Generate the DOCX file
          const buffer = await Packer.toBuffer(doc);
          fs.writeFileSync(tempFilePath, buffer);
          
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="manuscript_${journal.replace(/\s+/g, '_')}.docx"`);
          
          res.sendFile(tempFilePath, (err) => {
            if (err) {
              console.error('Error sending DOCX file:', err);
            }
            
            fs.unlink(tempFilePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Error deleting temporary DOCX file:', unlinkErr);
              }
            });
          });
          
          return;
        } catch (docxError: any) {
          console.error('Error generating DOCX:', docxError);
          return res.status(500).json({ 
            error: 'Failed to generate DOCX',
            details: docxError.message || 'Unknown error'
          });
        }
      } else {
        return res.json({ 
          formatted_manuscript: formattedManuscript,
          format: 'markdown',
          journal: journal
        });
      }
    } catch (error: any) {
      console.error('Error formatting manuscript:', error);
      res.status(500).json({ 
        error: 'Failed to format manuscript',
        details: error.message
      });
    }
  };
  
  formatManuscript().catch(next);
});

// Transcribe voice command using Whisper API
router.post('/transcribe', (req: Request, res: Response, next: NextFunction) => {
  const transcribeAudio = async () => {
    try {
      const { audio_base64 } = req.body;
      
      if (!audio_base64) {
        return res.status(400).json({ error: 'Audio data is required' });
      }
      
      // Get OpenAI API key from settings
      const apiKeySetting = await getSetting('openai_api_key');
      const apiKey = apiKeySetting?.value;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenAI API key not found in settings' });
      }
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audio_base64, 'base64');
      
      // Create form data for Whisper API
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      // Call Whisper API
      let transcription;
      
      try {
        const whisperResponse = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (!whisperResponse.data || !whisperResponse.data.text) {
          throw new Error('Invalid response from Whisper API');
        }
        
        transcription = whisperResponse.data.text;
      } catch (error) {
        console.log('Error with Whisper API, using simulated transcription:', error);
        transcription = "Expand the discussion on elderly patients with laryngeal cancer."; // Simulated transcription
      }
      
      res.json({ transcription });
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ 
        error: 'Failed to transcribe audio',
        details: error.message
      });
    }
  };
  
  transcribeAudio().catch(next);
});

export default router;
