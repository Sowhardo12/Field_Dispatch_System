import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export const ALLOWED_TECHNICIAN_TYPES = [
  'electrician',
  'plumber',
  'hvac',
  'appliance_repair',
  'it_network',
  'universal',
] as const;

export type TechnicianType = typeof ALLOWED_TECHNICIAN_TYPES[number];

@Injectable()
export class AiClassifierService {
  private readonly logger = new Logger(AiClassifierService.name);
  private groq: Groq;

  constructor(private configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      
    });
  }

  async classifyWorkOrder(title: string, description: string): Promise<TechnicianType> {
    const prompt = `
      You are an AI Dispatcher. Analyze the following work order title and description to categorize what kind of technician is required.
      
      Categories available:
      - electrician (electrical, wiring, switches, power issues, light fixtures)
      - plumber (water leak, pipes, sink, drainage, bathroom/kitchen plumbing)
      - hvac (ac repair, cooling, heating, air filtration)
      - appliance_repair (oven, refrigerator, microwave, washing machine)
      - it_network (wifi, router, server, computer hardware, cabling)
      - universal (if ambiguous, multiple, or doesn't cleanly match the above categories)

      Work Order Title: "${title}"
      Work Order Description: "${description || ''}"

      Respond with EXACTLY ONE word corresponding to the category key (e.g., "electrician", "plumber", or "universal"). Do NOT provide markdown, punctuation, or explanations.
    `;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.1,
        max_tokens: 60,
      });

      const usage = response.usage;
      this.logger.log(
        `[Groq AI Token Log] Completion Tokens: ${usage?.completion_tokens || 0} | Prompt Tokens: ${usage?.prompt_tokens || 0} | Total Tokens: ${usage?.total_tokens || 0} ai returned: ${response}`,
      );
      

      const predictedType = response.choices[0]?.message?.content?.trim().toLowerCase();

      if (ALLOWED_TECHNICIAN_TYPES.includes(predictedType as TechnicianType)) {
        this.logger.log(`AI classified Work Order as category: [${predictedType}]`);
        return predictedType as TechnicianType;
      }

      this.logger.warn(`AI returned unmapped category "${predictedType}". Falling back to "universal".`);
      return 'universal';
    } catch (error) {
      this.logger.error(`Groq AI classification failed. Falling back to "universal": ${error.message}`);
      return 'universal';
    }
  }
}