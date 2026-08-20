import { IsUUID, IsNotEmpty } from 'class-validator';

export class SetDepartmentHeadDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
