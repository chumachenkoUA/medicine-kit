import { PartialType } from '@nestjs/mapped-types';
import { CreateTabletoDto } from './create-tableto.dto';

export class UpdateTabletoDto extends PartialType(CreateTabletoDto) {}
