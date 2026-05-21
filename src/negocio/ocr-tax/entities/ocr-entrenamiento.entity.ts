/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Comprobante } from '../../comprobantes/entities/comprobante.entity';
import { ComprobanteVenta } from '../../comprobantes-ventas/entities/comprobante-venta.entity';

export enum EstadoEntrenamiento {
  PENDIENTE = 'PENDIENTE',
  LISTO_PARA_ENTRENAR = 'LISTO_PARA_ENTRENAR',
  ENTRENADO = 'ENTRENADO',
  DESCARTADO = 'DESCARTADO',
}

@Entity('ocr_entrenamientos')
export class OcrEntrenamiento {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // Se vuelve nullable para soportar las ventas
  @Column({ type: 'int', unsigned: true, nullable: true })
  comprobante_id: number;

  // Nueva columna para la tabla de ventas
  @Column({ type: 'int', unsigned: true, nullable: true })
  comprobante_venta_id: number;

  // Relación 1 a 1 con el comprobante real (Compras) - Ahora es nullable
  @OneToOne(() => Comprobante, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: Comprobante;

  // Relación 1 a 1 con el comprobante de ventas (Ingresos)
  @OneToOne(() => ComprobanteVenta, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'comprobante_venta_id' })
  comprobanteVenta: ComprobanteVenta;

  @Column({ type: 'varchar', length: 255 })
  url_imagen: string;

  @Column({ type: 'json' })
  json_maquina: any;

  @Column({ type: 'json', nullable: true })
  json_humano: any;

  @Column({
    type: 'enum',
    enum: EstadoEntrenamiento,
    default: EstadoEntrenamiento.PENDIENTE,
  })
  estado_entrenamiento: EstadoEntrenamiento;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  fecha_actualizacion: Date;
}
