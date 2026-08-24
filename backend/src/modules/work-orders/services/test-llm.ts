// test-llm.ts (anywhere in your project)
import { ConfigService } from '@nestjs/config';
import { AiClassifierService } from './ai-classifier';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Find .env file by searching up the directory tree
function findEnvFile(startPath: string): string | null {
  let currentPath = startPath;
  
  while (true) {
    const envPath = path.join(currentPath, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      // Reached root, stop searching
      break;
    }
    currentPath = parentPath;
  }
  
  return null;
}

// Load .env from wherever it is
const envPath = findEnvFile(__dirname);
if (envPath) {
  console.log(`📄 Found .env at: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('❌ .env file not found anywhere!');
  process.exit(1);
}

async function testLLM() {
  console.log('🚀 Testing GROQ API Call...\n');

  try {
    const configService = new ConfigService();
    const apiKey = configService.get<string>('GROQ_API_KEY');
    
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY not found in .env');
      process.exit(1);
    }

    console.log('✅ API Key loaded');

    const service = new AiClassifierService(configService);

    const result = await service.classifyWorkOrder(
      'Flickering Lights in Kitchen',
      'The lights keep flickering and sometimes turn off completely.'
    );

    console.log(`✅ Result: "${result}"`);
    console.log('\n✨ LLM call successful!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLLM();