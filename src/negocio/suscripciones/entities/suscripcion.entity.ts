/* eslint-disable prettier/prettier */

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Contribuyente } from '../../../negocio/contribuyentes/entities/contribuyente.entity';
import { CuotaPago } from '../../cuotas-pagos/entities/cuota-pago.entity';

export enum EstadoSuscripcion {
  ACTIVO = 'ACTIVO',
  MOROSO = 'MOROSO',
  CANCELADO = 'CANCELADO',
}

@Entity('suscripciones')
export class Suscripcion {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  contribuyente_id: number;

  @ManyToOne(() => Contribuyente, (contribuyente) => contribuyente.suscripciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contribuyente_id' })
  contribuyente: Contribuyente;

  @Column({ type: 'enum', enum: EstadoSuscripcion, default: EstadoSuscripcion.ACTIVO })
  estado: EstadoSuscripcion;

  @Column({ type: 'date' })
  fecha_inicio: string;

  @OneToMany(() => CuotaPago, (cuota) => cuota.suscripcion, { cascade: true })
  cuotas: CuotaPago[];
}