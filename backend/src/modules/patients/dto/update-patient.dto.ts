import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

// Phone cannot be updated for identity protection
export class UpdatePatientDto extends PartialType(
    OmitType(CreatePatientDto, ['phone'] as const),
) { }
