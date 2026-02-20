import { PartialType } from '@nestjs/mapped-types';
import { CreateTabletosUserDto } from './create-tabletos-user.dto';

export class UpdateTabletosUserDto extends PartialType(CreateTabletosUserDto) {}
