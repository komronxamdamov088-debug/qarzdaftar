import { IsIn } from 'class-validator';

export class ConfirmDebtDto {
  @IsIn(['confirm', 'reject'])
  action!: 'confirm' | 'reject';
}
