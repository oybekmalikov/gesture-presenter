import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LiveSession } from './live-session.entity';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  liveSessionId: string;

  @ManyToOne(() => LiveSession, (ls) => ls.recordings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'liveSessionId' })
  liveSession: LiveSession;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ default: 0 })
  durationSeconds: number;

  @CreateDateColumn()
  createdAt: Date;
}
