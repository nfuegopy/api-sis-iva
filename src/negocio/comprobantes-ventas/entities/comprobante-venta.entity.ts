/* eslint-disable prettier/prettier */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contribuyente } from '../../contribuyentes/entities/contribuyente.entity';

@Entity('comprobantes_ventas')
export class ComprobanteVenta {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  contribuyente_id: number;

  @ManyToOne(
    () => Contribuyente,
    (contribuyente) => contribuyente.comprobantes, // Asegúrate de agregar comprobantesVentas a la entidad Contribuyente luego si lo necesitas
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'contribuyente_id' })
  contribuyente: Contribuyente;

  @Column({ type: 'varchar', length: 15 })
  nro_comprobante: string;

  @Column({ type: 'varchar', length: 8 })
  timbrado: string;

  @Column({ type: 'date' })
  fecha_emision: string;

  @Column({ type: 'int', default: 109 })
  tipo_comprobante_set: number;

  @Column({ type: 'int', default: 1 })
  condicion_operacion: number;

  // --- DATOS DEL CLIENTE (RECEPTOR) ---
  @Column({ type: 'varchar', length: 20 })
  ruc_cliente: string;

  @Column({ type: 'varchar', length: 255 })
  razon_social_cliente: string;
  // ------------------------------------

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

  // --- IMPUTACIONES SET (Ventas) ---
  @Column({ type: 'char', length: 1, default: 'N' })
  moneda_extranjera: string;

  @Column({ type: 'char', length: 1, default: 'S' })
  imputa_iva: string;

  @Column({ type: 'char', length: 1, default: 'N' })
  imputa_ire: string;

  @Column({ type: 'char', length: 1, default: 'S' })
  imputa_irp: string;
  // ---------------------------------
  // --- NUEVOS CAMPOS PARA LA BOLSA COMÚN (UBER) ---
  @Column({ type: 'int', unsigned: true, nullable: true })
  revisor_id: number; // Guardará el ID del contador que reclamó la factura

  @Column({ type: 'timestamp', nullable: true })
  fecha_reclamado: Date; // Para saber hace cuánto tiempo la está revisando
  // ------------------------------------------------
  @Column({ type: 'varchar', length: 255, nullable: true })
  url_foto_webp: string;

  @Column({
    type: 'enum',
    enum: [
      'EN_COLA',
      'PROCESANDO',
      'AUTO_PROCESADO',
      'REQUIERE_REVISION',
      'VERIFICADO_HUMANO',
      'ERROR_PROCESAMIENTO',
    ],
    default: 'EN_COLA',
    nullable: true,
  })
  estado_ocr: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confianza_ocr: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, select: false })
  deleted_at: Date;
}
