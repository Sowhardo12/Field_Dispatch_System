import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateWorkLogDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  checklists?: string[];

  @IsObject()
  @IsOptional()
  hardware_metadata?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  technician_notes!: string;
}