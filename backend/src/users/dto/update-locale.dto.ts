import { IsIn } from 'class-validator';

export class UpdateLocaleDto {
  @IsIn(['uz', 'ru'])
  locale: 'uz' | 'ru';
}
