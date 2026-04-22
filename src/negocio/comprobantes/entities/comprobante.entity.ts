/* eslint-disable prettier/prettier */

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contribuyente } from '../../contribuyentes/entities/contribuyente.entity';

export enum TipoPapel {
  TERMICO = 'TERMICO',
  MATRICIAL = 'MATRICIAL',
  PREIMPRESO = 'PREIMPRESO',
}

@Entity('comprobantes')
export class Comprobante {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  contribuyente_id: number;

  @ManyToOne(
    () => Contribuyente,
    (contribuyente) => contribuyente.comprobantes,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'contribuyente_id' })
  contribuyente: Contribuyente;

  @Column({ type: 'varchar', length: 15 })
  nro_comprobante: string;

  @Column({ type: 'varchar', length: 8 })
  timbrado: string;

  @Column({ type: 'varchar', length: 20 })
  ruc_emisor: string;

  @Column({ type: 'varchar', length: 255 })
  razon_social_emisor: string;

  @Column({ type: 'date' })
  fecha_emision: string;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  gravada_10: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  gravada_5: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  exenta: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  iva_10: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  iva_5: number;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  monto_total: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_foto_webp: string;

  @Column({ type: 'enum', enum: TipoPapel, nullable: true })
  tipo_papel: TipoPapel;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confianza_ocr: number;
}
