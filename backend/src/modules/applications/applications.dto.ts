import { Status } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from "class-validator";

export class CreateApplicationDto {
  @IsString()
  @MinLength(1)
  company!: string;

  @IsString()
  @MinLength(1)
  position!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  jobUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  company?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  position?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  jobUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

export class ListApplicationsQueryDto {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
