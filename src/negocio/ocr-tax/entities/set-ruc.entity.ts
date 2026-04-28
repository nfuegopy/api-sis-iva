/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('set_rucs')
export class SetRuc {
  @PrimaryColumn({ type: 'varchar', length: 15 })
  ruc: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  dv: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razon_social: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  estado: string;
}
