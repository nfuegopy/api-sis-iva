/* eslint-disable prettier/prettier */

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Suscripcion } from '../../suscripciones/entities/suscripcion.entity';

export enum EstadoCuota {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  VENCIDO = 'VENCIDO',
}

@Entity('cuotas_pagos')
export class CuotaPago {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  suscripcion_id: number;

  @ManyToOne(() => Suscripcion, (suscripcion) => suscripcion.cuotas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'suscripcion_id' })
  suscripcion: Suscripcion;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  monto: number;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @Column({ type: 'date', nullable: true })
  fecha_pago: string;

  @Column({ type: 'enum', enum: EstadoCuota, default: EstadoCuota.PENDIENTE })
  estado: EstadoCuota;
}
