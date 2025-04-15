import { Request, Response } from 'express';
import { getSettings, getSetting, saveSetting } from '../models/settings';
import axios from 'axios';

export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const getSettingByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const setting = await getSetting(key);
    
    if (!setting) {
      return res.status(404).json({ error: `Setting with key ${key} not found` });
    }
    
    res.json(setting);
  } catch (error) {
    console.error(`Error fetching setting:`, error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    const setting = await saveSetting(key, value);
    res.json(setting);
  } catch (error) {
    console.error('Error saving setting:', error);
    res.status(500).json({ error: 'Failed to save setting' });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'API key type is required' });
    }
    
    const setting = await getSetting(key);
    
    if (!setting || !setting.value) {
      return res.status(404).json({ error: `API key for ${key} not found or empty` });
    }
    
    let result;
    
    switch (key) {
      case 'openai_api_key':
        result = await testOpenAIConnection(setting.value);
        break;
      case 'entrez_api_key':
        result = await testEntrezConnection(setting.value);
        break;
      case 'nsqip_api_key':
        result = { success: true, message: 'NSQIP API connection successful (simulated)' };
        break;
      case 'seer_api_key':
        result = { success: true, message: 'SEER API connection successful (simulated)' };
        break;
      default:
        return res.status(400).json({ error: `Unknown API key type: ${key}` });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: 'Failed to test connection', details: error.message });
  }
};

const testOpenAIConnection = async (apiKey: string) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 5
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return { success: true, message: 'OpenAI API connection successful' };
  } catch (error: any) {
    throw new Error(`OpenAI API connection failed: ${error.message}`);
  }
};

const testEntrezConnection = async (apiKey: string) => {
  try {
    const response = await axios.get(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=cancer&retmode=json&api_key=${apiKey}`
    );
    
    if (response.data && response.data.esearchresult) {
      return { success: true, message: 'Entrez API connection successful' };
    } else {
      throw new Error('Invalid response from Entrez API');
    }
  } catch (error: any) {
    throw new Error(`Entrez API connection failed: ${error.message}`);
  }
};
