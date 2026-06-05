/* eslint-disable prettier/prettier */

import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Persona } from '../../../gestion/personas/entities/persona.entity';
import { Comprobante } from '../../comprobantes/entities/comprobante.entity';
import { Suscripcion } from '../../suscripciones/entities/suscripcion.entity';

export enum TipoImpuesto {
  IVA_GENERAL = 'IVA_GENERAL',
  IRP_RSP = 'IRP_RSP',
  IRE_RESIMPLE = 'IRE_RESIMPLE',
}

@Entity('contribuyentes')
export class Contribuyente {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  persona_id: number;

  @OneToOne(() => Persona, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @Column({ type: 'varchar', length: 20 })
  ruc: string;

  @Column({ type: 'int' })
  dv: number;

  @Column({ type: 'varchar', length: 255 })
  razon_social: string;

  @Column({ type: 'enum', enum: TipoImpuesto })
  tipo_impuesto: TipoImpuesto;

  @OneToMany(() => Comprobante, (comprobante) => comprobante.contribuyente)
  comprobantes: Comprobante[];

  @OneToMany(() => Suscripcion, (suscripcion) => suscripcion.contribuyente)
  suscripciones: Suscripcion[];

  @DeleteDateColumn({ type: 'timestamp', nullable: true, select: false })
  deleted_at: Date;
}
