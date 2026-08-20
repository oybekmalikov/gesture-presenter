import { IsEnum, IsNotEmpty } from 'class-validator';
import { SeminarStatus } from '../../../common/enums';

export class UpdateSeminarStatusDto {
  @IsEnum(SeminarStatus)
  @IsNotEmpty()
  status: SeminarStatus;
}
