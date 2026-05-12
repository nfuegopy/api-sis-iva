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

  @Column({ type: 'int', unsigned: true })
  comprobante_id: number;

  // Relación 1 a 1 con el comprobante real
  @OneToOne(() => Comprobante, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: Comprobante;

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
