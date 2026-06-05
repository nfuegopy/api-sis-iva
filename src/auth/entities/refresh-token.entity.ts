/* eslint-disable prettier/prettier */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from 'src/gestion/usuarios/entities/usuario.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  usuario_id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expira_en: Date;

  @Column({ type: 'boolean', default: false })
  revocado: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
