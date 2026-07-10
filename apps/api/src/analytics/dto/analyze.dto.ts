import { IsString } from 'class-validator';

export class AnalyzeDto {
  @IsString()
  text: string = '';
}
