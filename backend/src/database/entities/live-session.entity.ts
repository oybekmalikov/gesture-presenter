import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { LiveSessionStatus } from '../../common/enums';
import { Seminar } from './seminar.entity';

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  seminarId: string;

  @ManyToOne(() => Seminar, (s) => s.liveSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seminarId' })
  seminar: Seminar;

  @Column({ length: 100, unique: true })
  roomId: string;

  @Column({
    type: 'enum',
    enum: LiveSessionStatus,
    default: LiveSessionStatus.WAITING,
  })
  status: LiveSessionStatus;

  @Column({ default: 0 })
  participantCount: number;

  @Column({ default: 0 })
  peakViewerCount: number;

  @Column({ nullable: true })
  currentFileId: string;

  @Column({ default: 0 })
  currentSlideIndex: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany('Recording', 'liveSession')
  recordings: any[];
}
