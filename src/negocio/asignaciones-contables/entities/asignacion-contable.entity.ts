/* eslint-disable prettier/prettier */

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contribuyente } from '../../contribuyentes/entities/contribuyente.entity';
import { Usuario } from '../../../gestion/usuarios/entities/usuario.entity';

@Entity('asignaciones_contables')
export class AsignacionContable {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  usuario_id: number;

  @Column({ type: 'int', unsigned: true })
  contribuyente_id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Contribuyente, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'contribuyente_id' })
  contribuyente: Contribuyente;
}
