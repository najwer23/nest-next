import {
  IsDateString,
  Validate,
} from 'class-validator';
import { IsReportDateRange } from '../validators/is-report-date-range.validator';

export class CreateReportDto {

  @IsDateString(
    {},
    {
      message:
        'dateFrom must be a valid date',
    },
  )
  dateFrom: string = "";


  @IsDateString(
    {},
    {
      message:
        'dateTo must be a valid date',
    },
  )
  @Validate(
    IsReportDateRange,
  )
  dateTo: string = "";
}