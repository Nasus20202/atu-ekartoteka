import type {
  MeterReadingDto,
  UtilitySettlementDto,
} from '@/lib/settlements/dto/settlement-view-dto';
import { utilityHeading } from '@/lib/settlements/rules/view-wording';

export interface PeriodMeter {
  meter: MeterReadingDto;
  /** The utility the meter belongs to, else its printed label */
  heading: string;
}

/** Every meter of one settlement, utility by utility. */
export const periodMeters = ({
  utilities,
  otherMeters,
}: UtilitySettlementDto): PeriodMeter[] => [
  ...utilities.flatMap(({ name, code, meters }) =>
    meters.map((meter) => ({ meter, heading: utilityHeading(name, code) }))
  ),
  ...otherMeters.map((meter) => ({ meter, heading: meter.label })),
];
