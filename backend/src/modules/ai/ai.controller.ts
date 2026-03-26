import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateContentDto } from './dto/generate.dto';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';

@UseGuards(CombinedAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate')
  generate(@Body() dto: GenerateContentDto) {
    return this.aiService.generate(dto);
  }

  @Post('generate-image')
  generateImage(@Body() dto: { prompt: string; size?: string; style?: string }) {
    return this.aiService.generateImage(dto.prompt, dto.size, dto.style);
  }
}
