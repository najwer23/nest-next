import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({
  name: 'IsReportDateRange',
  async: false,
})
export class IsReportDateRange
  implements ValidatorConstraintInterface {

  validate(
    dateTo: string,
    args: ValidationArguments,
  ) {

    const dto =
      args.object as {
        dateFrom: string;
        dateTo: string;
      };

    const from = new Date(dto.dateFrom);
    from.setHours(0, 0, 0, 0);

    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (from > to) {
      return false;
    }

    if (to > todayEnd) {
      return false;
    }

    const diff =
      to.getTime() -
      from.getTime();

    const days =
      diff / (1000 * 60 * 60 * 24);

    if (days > 365) {
      return false;
    }

    return true;
  }

  defaultMessage(
    args: ValidationArguments,
  ) {

    const dto =
      args.object as {
        dateFrom: string;
        dateTo: string;
      };

    const from = new Date(dto.dateFrom);
    from.setHours(0, 0, 0, 0);

    const to = new Date(dto.dateTo);
    to.setHours(23, 59, 59, 999);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (from > to) {
      return 'dateFrom must be before dateTo';
    }

    if (to > todayEnd) {
      return 'date range cannot be in the future';
    }

    return 'date range cannot exceed 365 days';
  }
}