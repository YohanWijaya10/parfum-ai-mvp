import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

class DeepSeekClient {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
    
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY tidak ditemukan di environment variables');
    }
  }

  async sendMessage(messages, options = {}) {
    try {
      const payload = {
        model: options.model || 'deepseek-chat',
        messages: messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        stream: false
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      // Uncomment for debugging:
      // console.error('🔍 Full error details:', {
      //   message: error.message,
      //   code: error.code,
      //   response: error.response?.status,
      //   responseData: error.response?.data
      // });
      
      if (error.response) {
        throw new Error(`DeepSeek API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error(`Connection Error: ${error.message || 'Tidak dapat terhubung ke DeepSeek API'}`);
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  }

  async getParfumRecommendation(userPreferences, parfumData) {
    // Create simplified data for API to reduce payload size
    const simplifiedData = {
      parfums: parfumData.parfums.map(p => ({
        name: p.name,
        brand: p.brand,
        category: p.category,
        gender: p.gender,
        notes: p.notes,
        description: p.description,
        price_range: p.price_range,
        longevity: p.longevity,
        sillage: p.sillage,
        season: p.season,
        occasion: p.occasion
      }))
    };

    const systemPrompt = `Anda adalah AI Parfum Consultant yang ahli dalam memberikan rekomendasi parfum. 
Anda memiliki pengetahuan mendalam tentang parfum, note-note fragrance, dan dapat memberikan rekomendasi yang personal.

Data parfum yang tersedia:
${JSON.stringify(simplifiedData, null, 2)}

Berikan rekomendasi 2-3 parfum terbaik yang cocok dengan preferensi user. 
Format:
1. Nama parfum dan brand
2. Alasan mengapa cocok
3. Deskripsi singkat karakteristik parfum

Gunakan bahasa Indonesia yang natural dan jangan terlalu formal.`;

    const userMessage = `Preferensi saya: ${userPreferences}

Tolong rekomendasikan parfum yang cocok untuk saya beserta alasannya.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    return await this.sendMessage(messages, { maxTokens: 1500 });
  }

  async answerParfumQuestion(question, parfumData) {
    // Create a summary of available parfums for context
    const parfumSummary = parfumData.parfums.map(p => 
      `${p.name} (${p.brand}) - ${p.category}, ${p.gender}`
    ).join('\n');

    const systemPrompt = `Anda adalah AI Parfum Consultant yang expert dalam dunia parfum. 
Anda dapat menjawab pertanyaan tentang parfum, fragrance notes, brand, cara pakai, dan tips seputar parfum.

Parfum yang tersedia dalam database:
${parfumSummary}

Jika pertanyaan spesifik tentang parfum tertentu, gunakan pengetahuan umum tentang parfum dan brand tersebut.
Jawab pertanyaan dengan informatif dan helpful. Gunakan bahasa Indonesia yang natural.

Jika user menanyakan tentang parfum yang tidak ada dalam database, berikan saran umum atau alternatif dari parfum yang tersedia.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];

    return await this.sendMessage(messages, { maxTokens: 1200 });
  }

  async compareParfums(parfum1, parfum2, parfumData) {
    // Find only the two parfums being compared
    const parfum1Data = parfumData.parfums.find(p => p.name === parfum1);
    const parfum2Data = parfumData.parfums.find(p => p.name === parfum2);
    
    if (!parfum1Data || !parfum2Data) {
      throw new Error('Salah satu atau kedua parfum tidak ditemukan dalam database');
    }

    // Create very minimal data for comparison to avoid payload issues
    const comparisonData = {
      parfum1: {
        name: parfum1Data.name,
        brand: parfum1Data.brand,
        category: parfum1Data.category,
        gender: parfum1Data.gender,
        notes: parfum1Data.notes,
        longevity: parfum1Data.longevity,
        sillage: parfum1Data.sillage,
        season: parfum1Data.season,
        occasion: parfum1Data.occasion
      },
      parfum2: {
        name: parfum2Data.name,
        brand: parfum2Data.brand,
        category: parfum2Data.category,
        gender: parfum2Data.gender,
        notes: parfum2Data.notes,
        longevity: parfum2Data.longevity,
        sillage: parfum2Data.sillage,
        season: parfum2Data.season,
        occasion: parfum2Data.occasion
      }
    };

    const systemPrompt = `Anda adalah AI Parfum Consultant yang ahli dalam membandingkan parfum.
Bandingkan dua parfum berikut secara objektif:

${parfum1Data.name} (${parfum1Data.brand}):
- Kategori: ${parfum1Data.category}
- Gender: ${parfum1Data.gender}
- Top Notes: ${parfum1Data.notes.top.join(', ')}
- Middle Notes: ${parfum1Data.notes.middle.join(', ')}
- Base Notes: ${parfum1Data.notes.base.join(', ')}
- Longevity: ${parfum1Data.longevity}
- Sillage: ${parfum1Data.sillage}
- Season: ${parfum1Data.season}
- Occasion: ${parfum1Data.occasion}

${parfum2Data.name} (${parfum2Data.brand}):
- Kategori: ${parfum2Data.category}
- Gender: ${parfum2Data.gender}
- Top Notes: ${parfum2Data.notes.top.join(', ')}
- Middle Notes: ${parfum2Data.notes.middle.join(', ')}
- Base Notes: ${parfum2Data.notes.base.join(', ')}
- Longevity: ${parfum2Data.longevity}
- Sillage: ${parfum2Data.sillage}
- Season: ${parfum2Data.season}
- Occasion: ${parfum2Data.occasion}

Berikan perbandingan dalam format yang jelas dan mudah dipahami.`;

    const userMessage = `Bandingkan ${parfum1} vs ${parfum2}. Jelaskan perbedaan utama dan rekomendasi untuk siapa masing-masing cocok.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    return await this.sendMessage(messages, { maxTokens: 1500, temperature: 0.7 });
  }
}

export default DeepSeekClient;