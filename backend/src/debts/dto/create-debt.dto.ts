import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PersonDto } from './person.dto';

export type DebtType = 'given' | 'taken';

export class CreateDebtDto {
  @ValidateNested()
  @Type(() => PersonDto)
  person!: PersonDto;

  @IsPositive()
  amount!: number;

  @IsIn(['given', 'taken'])
  type!: DebtType;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @MaxLength(500)
  note?: string;
}
