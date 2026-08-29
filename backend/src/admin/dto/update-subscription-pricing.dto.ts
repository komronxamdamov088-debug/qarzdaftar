import { IsNumber, Max, Min, ValidateIf } from 'class-validator';

// `@IsOptional()` treats both `undefined` and `null` as "skip validation" —
// but a bad frontend numeric input (e.g. a stray "%" character) becomes
// `NaN`, which `JSON.stringify` silently turns into `null` over the wire.
// With `@IsOptional()` that null would sail straight past validation and
// into a `NOT NULL` database column, crashing as a masked 500 instead of a
// clean 400. `@ValidateIf` only skips on genuinely-omitted (`undefined`)
// fields, so an explicit `null` is validated and rejected like any other
// bad value.
export class UpdateSubscriptionPricingDto {
  @ValidateIf((dto: UpdateSubscriptionPricingDto) => dto.price !== undefined)
  @IsNumber()
  @Min(0)
  price?: number;

  @ValidateIf(
    (dto: UpdateSubscriptionPricingDto) => dto.discountPercent !== undefined,
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}
